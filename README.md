# 🧠 AI Invoice Parser - Hackathon Prototype

## ✨ Overview
A lightweight AI-powered web app that automates the extraction of structured, machine-readable data from PDF invoices. Built as a Ramp-style prototype for the AI x Fintech Build Day hackathon.

## 🚀 Getting Started

### Prerequisites
- Python 3.8+ for the backend
- Node.js and npm for the frontend
- OpenAI API key (optional - mock data will be used if not provided)

### Backend Setup
1. Navigate to the project directory
2. Install dependencies:
   ```bash
   pip install -e .
   ```
3. Set your OpenAI API key in `backend/.env` (optional)
4. Start the backend server:
   ```bash
   cd backend
   python run.py
   ```
   The server will be available at http://localhost:8080

### Frontend Setup
1. Navigate to the frontend directory
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at http://localhost:3000

## 🌟 Features
- Upload PDF invoices via a simple front-end interface
- AI-powered extraction of structured data using OpenAI's API
- Editable form for reviewing and correcting extracted data
- Feedback loop to log corrections and improve future performance
- Mock data for development without an API key

## 🛠️ Architecture

### 🔹 Front-End (Next.js)
- PDF Upload component with drag-and-drop functionality
- Form viewer for extracted data using Formik
- Responsive design with Tailwind CSS

### 🔹 Back-End (FastAPI)
- `/api/upload` endpoint for PDF invoice processing
- Integration with OpenAI's API using the ChatCompletion endpoint
- PDF text extraction using PyMuPDF
- Structured JSON output following a predefined schema
- Correction logging endpoint for feedback loop

### 🔹 Prompt Design
The prompt is carefully designed to instruct the language model to extract core invoice fields, vendor and customer metadata, line items, and any additional free-form notes. It also guides the model to normalize dates and currency formats, infer categories, and validate numerical consistency.

## 📁 Project Structure
```
/
├── backend/            # FastAPI backend
│   ├── app/            # Application code
│   │   ├── main.py     # Main FastAPI application
│   │   └── models.py   # Pydantic models
│   ├── .env            # Environment variables
│   └── run.py          # Server startup script
├── frontend/           # Next.js frontend
│   ├── src/            # Source code
│   │   ├── app/        # Next.js app directory
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   └── types/      # TypeScript types
├── invoices/           # Sample invoice PDFs
├── prompts.py          # OpenAI prompt templates
└── invoice_field_descriptions.md  # Schema documentation
```

## 📚 Reference
See `invoice_field_descriptions.md` for detailed schema explanation.

---

Let the AI do the paperwork. You focus on the real work. 💥
