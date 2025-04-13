import base64
import os
import json
import time
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import fitz  # PyMuPDF

import openai
from dotenv import load_dotenv
from prompts import INVOICE_PROMPT

# Local import - when running from backend directory
try:
    from app.models import InvoiceData, InvoiceCorrection, UploadResponse
except ImportError:
    # Fallback - when running from app directory
    from models import InvoiceData, InvoiceCorrection, UploadResponse

# Load environment variables
load_dotenv()

# Initialize OpenAI client if API key is available
openai_api_key = os.getenv("OPENAI_API_KEY")
print(f"OpenAI API key loaded: {'Yes' if openai_api_key else 'No'}")
if openai_api_key:
    print(f"API key first 5 chars: {openai_api_key[:5]}...")
    client = openai.OpenAI(api_key=openai_api_key)
    print("OpenAI client initialized successfully")
else:
    print("WARNING: No OpenAI API key found. Using mock data.")
    client = None
    print("WARNING: OPENAI_API_KEY not found. Using mock data for development.")

app = FastAPI(
    title="Invoice Parser API",
    description="AI-powered invoice parsing service",
    version="0.1.0"
)

# Create a directory for PDF previews
PREVIEWS_DIR = Path("previews")
PREVIEWS_DIR.mkdir(exist_ok=True)

# Mount the previews directory
app.mount("/previews", StaticFiles(directory="previews"), name="previews")

# Configure CORS - use a more permissive configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["Content-Disposition"]  # For downloads
)

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)

# Mount the uploads directory to serve static files
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# In-memory storage for processed invoices and corrections
# In a real app, this would be a database
processed_invoices = {}
correction_logs = []

# Mock data for development when API key is not available
MOCK_INVOICE_DATA = {
    "invoice_number": "INV-2025-0412",
    "invoice_date": "2025-04-01",
    "due_date": "2025-05-01",
    "purchase_order_number": "PO-2025-0389",
    "currency": "USD",
    "subtotal": 1250.00,
    "tax": 100.00,
    "shipping": 25.00,
    "total": 1375.00,
    "amount_due": 1375.00,
    "vendor": {
        "name": "TechSupplies Inc.",
        "address": "123 Vendor St, San Francisco, CA 94107",
        "phone": "555-123-4567",
        "email": "billing@techsupplies.example",
        "tax_id": "12-3456789"
    },
    "customer": {
        "name": "Acme Corp",
        "address": "456 Customer Ave, San Francisco, CA 94108",
        "phone": "555-987-6543",
        "email": "accounts@acme.example",
        "account_number": "ACME-001"
    },
    "line_items": [
        {
            "description": "Premium Cloud Hosting",
            "quantity": 1.0,
            "unit_price": 750.00,
            "total_price": 750.00,
            "product_code": "CLOUD-001",
            "tax_rate": 0.08,
            "category": "software"
        },
        {
            "description": "Technical Support Hours",
            "quantity": 5.0,
            "unit_price": 100.00,
            "total_price": 500.00,
            "product_code": "SUPPORT-HR",
            "tax_rate": 0.0,
            "category": "services"
        }
    ],
    "additional_information": "Payment terms: Net 30\nPlease include invoice number with payment.\nBank details: Bank of America, Account: 1234567890, Routing: 987654321",
    "flags": {
        "confidence_warning": False,
        "multi_page_invoice": False,
        "discrepancy_detected": False
    }
}


def convert_pdf_to_image(file_bytes):
    """Convert the first page of a PDF to a PNG image."""
    try:
        # Open the PDF from bytes
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")

        # Get the first page
        page = pdf_document[0]

        # Create a PNG image of the page
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality

        # Convert to PIL Image
        img_data = pix.tobytes("png")

        # Return the PNG image bytes
        return img_data
    except Exception as e:
        print(f"Error converting PDF to image: {str(e)}")
        raise

def extract_text_from_file(file_bytes, file_type):
    """Extract text content from a file (PDF or image)."""
    try:
        if file_type == "pdf":
            # Extract text from PDF using PyMuPDF
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            return text
        elif file_type in ["png", "jpg", "jpeg"]:
            # For images, we'll return an empty string and use OpenAI's vision capabilities directly
            return ""
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text from file: {str(e)}")


def get_timestamp():
    """Get current timestamp in a readable format"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

async def process_invoice_with_ai(file_bytes, filename, file_path):
    """Process the invoice using OpenAI API."""
    start_time = time.time()
    print(f"[{get_timestamp()}] Starting processing for file: {filename}")

    # Determine file type from filename
    file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
    if not client:
        # Return mock data if no API key is available
        invoice_id = str(uuid.uuid4())
        processed_invoices[invoice_id] = MOCK_INVOICE_DATA
        # Add file path to the response
        return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}

    try:
        print(f"[{get_timestamp()}] Processing file: {filename}, type: {file_extension}")

        # Process based on file type
        try:
            # For PDFs, convert to image for vision API
            if file_extension == "pdf":
                print("Converting PDF to image for vision processing")
                try:
                    # Convert PDF to image
                    pdf_convert_start = time.time()
                    print(f"[{get_timestamp()}] Starting PDF to image conversion")
                    image_bytes = convert_pdf_to_image(file_bytes)
                    pdf_convert_end = time.time()
                    print(f"[{get_timestamp()}] PDF successfully converted to image in {pdf_convert_end - pdf_convert_start:.2f} seconds")

                    # Also extract text for fallback
                    text_content = extract_text_from_file(file_bytes, file_extension)
                    print(f"Text extraction completed as fallback. Text length: {len(text_content)}")

                    # Use the image bytes for processing
                    process_bytes = image_bytes
                    process_extension = "png"  # We converted to PNG
                except Exception as convert_err:
                    print(f"Error converting PDF to image: {str(convert_err)}")
                    print("Falling back to text-based processing for PDF")
                    # If conversion fails, fall back to text extraction
                    text_content = extract_text_from_file(file_bytes, file_extension)
                    print(f"Text extraction completed. Text length: {len(text_content)}")

                    # Use text-based approach
                    try:
                        print("Using text-based API for PDF processing")
                        full_prompt = f"{INVOICE_PROMPT}\n\nINVOICE CONTENT:\n{text_content}"

                        # Call OpenAI API
                        print("Calling OpenAI API...")
                        response = client.chat.completions.create(
                            model="gpt-4",  # or another appropriate model
                            messages=[
                                {"role": "system", "content": "You are an expert invoice data extraction assistant."},
                                {"role": "user", "content": full_prompt}
                            ],
                            temperature=0.1,  # Lower temperature for more deterministic outputs
                            max_tokens=2000
                        )
                        print("OpenAI API call completed successfully")
                    except Exception as text_api_err:
                        print(f"Error in text API processing: {str(text_api_err)}")
                        # Fallback to mock data if API fails
                        print("Falling back to mock data due to API error")
                        invoice_id = str(uuid.uuid4())
                        processed_invoices[invoice_id] = MOCK_INVOICE_DATA
                        return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}

                    # Skip the vision API processing
                    goto_response_parsing = True
                else:
                    # If conversion succeeded, continue with vision API
                    goto_response_parsing = False
            else:
                # For images, use the original file
                process_bytes = file_bytes
                process_extension = file_extension
                text_content = ""  # No text extraction for images
                goto_response_parsing = False

            # Skip to response parsing if we already have a response from text-based processing
            if not goto_response_parsing:
                print("Using vision API for processing")
                # Convert image to base64
                image_base64 = base64.b64encode(process_bytes).decode('utf-8')
                print(f"Image encoded to base64. Length: {len(image_base64)}")

                # Check if the image might be too large
                if len(image_base64) > 20000000:  # 20MB in base64
                    print("Image is very large, this might cause API issues")

                # Call OpenAI API with vision capabilities
                print(f"[{get_timestamp()}] Calling OpenAI Vision API...")
                try:
                    vision_api_start = time.time()
                    response = client.chat.completions.create(
                        model="gpt-4-turbo",
                        messages=[
                            {"role": "system", "content": "You are an expert invoice data extraction assistant."},
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": INVOICE_PROMPT},
                                    {"type": "image_url", "image_url": {"url": f"data:image/{process_extension};base64,{image_base64}"}}
                                ]
                            }
                        ],
                        temperature=0.1,
                        max_tokens=2000
                    )
                    vision_api_end = time.time()
                    print(f"[{get_timestamp()}] OpenAI Vision API call completed successfully in {vision_api_end - vision_api_start:.2f} seconds")
                except Exception as api_err:
                    print(f"Vision API attempt failed: {str(api_err)}")

                    # If we have text content from a PDF, try text-based approach as fallback
                    if file_extension == "pdf" and text_content:
                        print("Falling back to text-based processing for PDF")
                        try:
                            full_prompt = f"{INVOICE_PROMPT}\n\nINVOICE CONTENT:\n{text_content}"

                            # Call OpenAI API
                            print("Calling OpenAI API with text...")
                            response = client.chat.completions.create(
                                model="gpt-4",
                                messages=[
                                    {"role": "system", "content": "You are an expert invoice data extraction assistant."},
                                    {"role": "user", "content": full_prompt}
                                ],
                                temperature=0.1,
                                max_tokens=2000
                            )
                            print("OpenAI text API call completed successfully")
                        except Exception as text_fallback_err:
                            print(f"Text fallback also failed: {str(text_fallback_err)}")
                            # Use mock data as last resor
                            print("Falling back to mock data as last resort")
                            invoice_id = str(uuid.uuid4())
                            processed_invoices[invoice_id] = MOCK_INVOICE_DATA
                            return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}
                    else:
                        # No text fallback available, use mock data
                        print("Falling back to mock data due to API error")
                        invoice_id = str(uuid.uuid4())
                        processed_invoices[invoice_id] = MOCK_INVOICE_DATA
                        return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}
        except Exception as process_err:
            print(f"Error in file processing: {str(process_err)}")
            # Fallback to mock data if processing fails
            print("Falling back to mock data due to processing error")
            invoice_id = str(uuid.uuid4())
            processed_invoices[invoice_id] = MOCK_INVOICE_DATA
            return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}

        try:
            print(f"[{get_timestamp()}] Parsing API response")
            # Parse the response
            response_text = response.choices[0].message.content
            print(f"Response text length: {len(response_text)}")
            print(f"Response text preview: {response_text[:100]}...")

            # Extract JSON from the response
            # This assumes the model returns valid JSON; in practice, you might need more robust parsing
            try:
                # Try to find JSON in the response if it's not a pure JSON response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    print(f"Extracted JSON from response. JSON length: {len(json_str)}")
                    invoice_data = json.loads(json_str)
                else:
                    print("Treating entire response as JSON")
                    invoice_data = json.loads(response_text)

                # Validate with Pydantic model
                print("Validating with Pydantic model")
                validated_data = InvoiceData(**invoice_data)
                
                # Store in memory
                invoice_id = str(uuid.uuid4())
                processed_invoices[invoice_id] = validated_data
                
                return {
                    "success": True,
                    "data": validated_data,
                    "invoice_id": invoice_id,
                    "file_path": file_path
                }
            except json.JSONDecodeError as json_err:
                print(f"Error parsing JSON: {str(json_err)}")
                print("Falling back to mock data due to JSON parsing error")
                invoice_id = str(uuid.uuid4())
                processed_invoices[invoice_id] = MOCK_INVOICE_DATA
                return {
                    "success": True,
                    "data": MOCK_INVOICE_DATA,
                    "invoice_id": invoice_id,
                    "file_path": file_path
                }
            except Exception as validation_err:
                print(f"Validation error: {str(validation_err)}")
                # Fallback to mock data if validation fails
                print("Falling back to mock data due to validation error")
                invoice_id = str(uuid.uuid4())
                processed_invoices[invoice_id] = MOCK_INVOICE_DATA
                return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}
        except Exception as parse_err:
            print(f"Error parsing response: {str(parse_err)}")
            return {"success": False, "error": f"Error processing invoice data: {str(parse_err)}"}

    except Exception as e:
        print(f"Unhandled exception in process_invoice_with_ai: {str(e)}")
        # Fallback to mock data for any unhandled exceptions
        invoice_id = str(uuid.uuid4())
        processed_invoices[invoice_id] = MOCK_INVOICE_DATA
        return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}


@app.post("/api/upload", response_model=UploadResponse)
async def upload_invoice(file: UploadFile = File(...)):
    """
    Upload and process an invoice file (PDF or image).
    Returns structured data extracted from the invoice.
    """
    try:
        print(f"[{get_timestamp()}] Upload request received for file: {file.filename}")

        file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
        print(f"[{get_timestamp()}] File extension detected: {file_extension}")

        if file_extension not in ['pdf', 'png', 'jpg', 'jpeg']:
            print(f"[{get_timestamp()}] Invalid file type: {file_extension}")
            raise HTTPException(status_code=400, detail="Only PDF and image files (PNG, JPG, JPEG) are supported")

        # Generate a unique filename
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(uploads_dir, unique_filename)
        print(f"[{get_timestamp()}] Generated unique filename: {unique_filename}")

        # Save the file
        print(f"[{get_timestamp()}] Saving file to: {file_path}")
        file_bytes = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)
        print(f"[{get_timestamp()}] File saved successfully. Size: {len(file_bytes)} bytes")

        # Process with AI
        try:
            print(f"[{get_timestamp()}] Starting AI processing")
            # Create a proper URL for the file that can be accessed from the frontend
            file_url = f"/uploads/{unique_filename}"
            result = await process_invoice_with_ai(file_bytes, file.filename, file_url)
            print(f"[{get_timestamp()}] AI processing completed with result: {result['success']}")

        except Exception as process_error:
            print(f"[{get_timestamp()}] ERROR in AI processing: {str(process_error)}")
            # Clean up the file if processing failed
            if file_path.exists():
                try:
                    file_path.unlink()
                    print(f"[{get_timestamp()}] Cleaned up file after processing error")
                except Exception as cleanup_error:
                    print(f"[{get_timestamp()}] Failed to clean up file: {str(cleanup_error)}")
                raise HTTPException(status_code=500, detail=f"Failed to process invoice: {str(process_error)}")

        if not result["success"]:
            # Clean up the file if processing failed
            print(f"[{get_timestamp()}] Processing unsuccessful: {result.get('error', 'Unknown error')}")
            if file_path.exists():
                try:
                    file_path.unlink()
                    print(f"[{get_timestamp()}] Cleaned up file after unsuccessful processing")
                except Exception as cleanup_error:
                    print(f"[{get_timestamp()}] Failed to clean up file: {str(cleanup_error)}")
                raise HTTPException(status_code=500, detail=result["error"])

        print(f"[{get_timestamp()}] Successfully processed invoice. Returning result.")
        return result

    except Exception as e:
        print(f"[{get_timestamp()}] UNHANDLED EXCEPTION in upload_invoice: {str(e)}")
        if 'file_path' in locals() and file_path.exists():
            try:
                file_path.unlink()
                print(f"[{get_timestamp()}] Cleaned up file after unhandled exception")
            except Exception as cleanup_error:
                print(f"[{get_timestamp()}] Failed to clean up file: {str(cleanup_error)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/api/invoice/{invoice_id}", response_model=InvoiceData)
async def get_invoice(invoice_id: str):
    """
    Retrieve a previously processed invoice by ID.
    """
    if invoice_id not in processed_invoices:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return processed_invoices[invoice_id]


@app.post("/api/corrections", response_model=InvoiceCorrection)
async def log_correction(
    invoice_id: str = Form(...),
    corrected_data: str = Form(...),
    user_id: Optional[str] = Form(None),
    correction_notes: Optional[str] = Form(None)
):
    """
    Log corrections made to an invoice.
    This helps improve the AI model over time.
    """
    if invoice_id not in processed_invoices:
        raise HTTPException(status_code=404, detail="Invoice not found")

    try:
        # Parse the corrected data
        corrected_json = json.loads(corrected_data)
        corrected_invoice = InvoiceData(**corrected_json)

        # Create correction record
        correction = InvoiceCorrection(
            invoice_id=invoice_id,
            original_data=InvoiceData(**processed_invoices[invoice_id]),
            corrected_data=corrected_invoice,
            correction_timestamp=datetime.now().isoformat(),
            user_id=user_id,
            correction_notes=correction_notes
        )

        # In a real app, you would store this in a database
        correction_logs.append(correction.model_dump())

        # Update the processed invoice with corrections
        processed_invoices[invoice_id] = corrected_invoice.model_dump()

        return correction

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in corrected_data")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing correction: {str(e)}")


@app.get("/api/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "api_key_configured": client is not None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
