import os
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import fitz  # PyMuPDF
import io
from PIL import Image
import pytesseract
import openai
from dotenv import load_dotenv
from prompts import INVOICE_PROMPT

from .models import InvoiceData, InvoiceCorrection, UploadResponse

# Load environment variables
load_dotenv()

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    client = openai.OpenAI(api_key=api_key)
else:
    print("WARNING: OPENAI_API_KEY not found. Using mock data for development.")
    client = None

app = FastAPI(
    title="Invoice Parser API",
    description="AI-powered invoice parsing service",
    version="0.1.0"
)

# Mount the uploads directory for serving files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

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
            # Extract text from image using Tesseract OCR via PIL
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            return text
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting text from file: {str(e)}")


async def process_invoice_with_ai(file_bytes, filename, file_path):
    """Process the invoice using OpenAI API."""
    # Determine file type from filename
    file_extension = filename.lower().split('.')[-1] if '.' in filename else ''
    if not client:
        # Return mock data if no API key is available
        invoice_id = str(uuid.uuid4())
        processed_invoices[invoice_id] = MOCK_INVOICE_DATA
        # Add file path to the response
        return {"success": True, "data": MOCK_INVOICE_DATA, "invoice_id": invoice_id, "file_path": str(file_path)}
    
    try:
        # Extract text from file (PDF or image)
        text_content = extract_text_from_file(file_bytes, file_extension)
        
        # Prepare the prompt with the extracted text
        full_prompt = f"{INVOICE_PROMPT}\n\nINVOICE CONTENT:\n{text_content}"
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4",  # or another appropriate model
            messages=[
                {"role": "system", "content": "You are an expert invoice data extraction assistant."},
                {"role": "user", "content": full_prompt}
            ],
            temperature=0.1,  # Lower temperature for more deterministic outputs
            max_tokens=2000
        )
        
        # Parse the response
        response_text = response.choices[0].message.content
        
        # Extract JSON from the response
        # This assumes the model returns valid JSON; in practice, you might need more robust parsing
        try:
            # Try to find JSON in the response if it's not a pure JSON response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                invoice_data = json.loads(json_str)
            else:
                invoice_data = json.loads(response_text)
                
            # Validate with Pydantic model
            validated_data = InvoiceData(**invoice_data)
            
            # Store in memory
            invoice_id = str(uuid.uuid4())
            processed_invoices[invoice_id] = validated_data.model_dump()
            
            return {"success": True, "data": validated_data, "invoice_id": invoice_id, "file_path": str(file_path)}
        except json.JSONDecodeError:
            return {"success": False, "error": "Failed to parse JSON from API response"}
        except Exception as e:
            return {"success": False, "error": f"Error processing invoice data: {str(e)}"}
    
    except Exception as e:
        return {"success": False, "error": f"Error calling OpenAI API: {str(e)}"}


@app.post("/api/upload", response_model=UploadResponse)
async def upload_invoice(file: UploadFile = File(...)):
    """
    Upload and process an invoice file (PDF or image).
    Returns structured data extracted from the invoice.
    """
    file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
    if file_extension not in ['pdf', 'png', 'jpg', 'jpeg']:
        raise HTTPException(status_code=400, detail="Only PDF and image files (PNG, JPG, JPEG) are supported")
    
    # Generate a unique filename
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / unique_filename
    
    # Save the file
    with open(file_path, "wb") as buffer:
        file_bytes = await file.read()
        buffer.write(file_bytes)
    
    # Process with AI
    result = await process_invoice_with_ai(file_bytes, file.filename, f"/uploads/{unique_filename}")
    
    if not result["success"]:
        # Clean up the file if processing failed
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result


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
