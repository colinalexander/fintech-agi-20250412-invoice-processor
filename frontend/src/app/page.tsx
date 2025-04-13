'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiFileText, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import FileUpload from '../components/FileUpload';
import InvoiceForm from '../components/InvoiceForm';
import { InvoiceData } from '../types/invoice';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'form'>('upload');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = (data: InvoiceData, id: string, path: string) => {
    setInvoiceData(data);
    setInvoiceId(id);
    setFilePath(path);
    setCurrentStep('form');
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleSaveSuccess = (updatedData: InvoiceData) => {
    setInvoiceData(updatedData);
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setInvoiceData(null);
    setInvoiceId(null);
    setFilePath(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FiFileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI Invoice Parser</h1>
          </div>
          <div className="text-sm text-gray-500">
            AI x Fintech Build Day Hackathon
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="px-4 sm:px-0 mb-8">
          <div className="border-b border-gray-200 pb-5">
            <nav className="flex space-x-8">
              <button
                onClick={handleReset}
                className={`${currentStep === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <span className="bg-blue-100 text-blue-600 p-1 rounded-full mr-2">
                  1
                </span>
                Upload Invoice
              </button>
              <button
                disabled={!invoiceData}
                className={`${currentStep === 'form' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${!invoiceData ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-700 hover:border-gray-300'}`}
              >
                <span className={`${currentStep === 'form' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} p-1 rounded-full mr-2`}>
                  2
                </span>
                Review & Edit
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 py-5 sm:p-6 bg-white shadow rounded-lg">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <FiAlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {currentStep === 'upload' ? (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">Upload an Invoice PDF</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Our AI will automatically extract all relevant information from your invoice.
                </p>
              </div>
              
              <FileUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />

              <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
                <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
                  <li>Your invoice will be processed by our AI</li>
                  <li>Extracted data will be presented in an editable form</li>
                  <li>You can review and correct any information</li>
                  <li>All edits are logged to improve future extraction accuracy</li>
                </ul>
              </div>
            </div>
          ) : (
            invoiceData && invoiceId && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Review Extracted Invoice Data</h2>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                  >
                    Upload Another Invoice
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filePath && (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Original Invoice</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <img 
                          src={`http://localhost:8080${filePath}`} 
                          alt="Original Invoice" 
                          className="w-full h-auto max-h-[800px] object-contain"
                        />
                      </div>
                    </div>
                  )}
                  
                  <InvoiceForm
                    invoiceData={invoiceData}
                    invoiceId={invoiceId}
                    onSaveSuccess={handleSaveSuccess}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </main>

      <footer className="bg-white mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AI Invoice Parser - Built for AI x Fintech Build Day Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}
