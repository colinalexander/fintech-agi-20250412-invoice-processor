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
            <Image 
              src="/images/Invoice-AI-Logo.png" 
              alt="Invoice AI Logo" 
              width={120} 
              height={120} 
              className="h-28 w-auto"
            />
            <h1 className="text-2xl font-bold text-gray-900">Invoice Parser</h1>
          </div>
          <div className="text-sm text-gray-500">
            AI x Fintech Build Day Hackathon
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto py-4 px-2">
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
                  {/* Left side: Original Invoice Viewer with zoom controls */}
                  <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                    <h3 className="text-lg font-medium text-gray-900 p-4 border-b border-gray-200">Original Invoice</h3>
                    
                    <div className="flex-1 min-h-[600px]">
                      {filePath ? (
                        filePath.endsWith('.pdf') ? (
                          // Enhanced PDF Viewer with embedded viewer and fallback
                          <div className="h-full w-full flex flex-col">
                            <div className="bg-gray-100 p-3 flex items-center justify-between border-b border-gray-200">
                              <span className="text-sm font-medium">PDF Document</span>
                              <div className="flex space-x-2">
                                <a 
                                  href={`http://localhost:8081${filePath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 text-sm hover:underline flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Open in new tab
                                </a>
                              </div>
                            </div>
                            
                            {/* Multi-approach PDF rendering with fallbacks */}
                            <div className="flex-1 bg-gray-50 flex flex-col relative overflow-hidden">
                              {/* Primary PDF viewer using object tag */}
                              <object
                                data={`http://localhost:8081${filePath}`}
                                type="application/pdf"
                                className="w-full h-full absolute inset-0 z-10"
                                onError={(e) => {
                                  // If object tag fails, we'll show the fallback iframe
                                  const element = e.currentTarget;
                                  element.style.display = 'none';
                                  const fallbackIframe = document.getElementById('pdf-fallback-iframe');
                                  if (fallbackIframe) fallbackIframe.style.display = 'block';
                                }}
                              >
                                {/* This content shows if the object tag is not supported */}
                                <p className="p-4 text-center">Your browser doesn't support embedded PDFs.</p>
                              </object>
                              
                              {/* Fallback iframe approach */}
                              <iframe
                                id="pdf-fallback-iframe"
                                src={`http://localhost:8081${filePath}`}
                                className="w-full h-full absolute inset-0 z-5"
                                style={{ display: 'none' }} // Hidden by default, shown if object fails
                                onError={(e) => {
                                  // If iframe fails too, show the ultimate fallback
                                  const element = e.currentTarget;
                                  element.style.display = 'none';
                                  const ultimateFallback = document.getElementById('pdf-ultimate-fallback');
                                  if (ultimateFallback) ultimateFallback.style.display = 'flex';
                                }}
                              ></iframe>
                              
                              {/* Ultimate fallback if both approaches fail */}
                              <div 
                                id="pdf-ultimate-fallback"
                                className="w-full h-full absolute inset-0 flex flex-col items-center justify-center p-6"
                                style={{ display: 'none' }} // Hidden by default
                              >
                                <div className="w-32 h-32 flex items-center justify-center rounded-full bg-blue-100 mb-4">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-800 mb-2">PDF Document Ready</p>
                                <p className="text-gray-600 mb-6">Your browser cannot display this PDF directly.</p>
                                <div className="flex space-x-4">
                                  <a 
                                    href={`http://localhost:8081${filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View PDF
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Image Viewer with zoom and pan controls
                          <div className="relative h-full w-full bg-gray-100 overflow-hidden">
                            {/* Control panel */}
                            <div className="absolute top-2 right-2 z-10 flex bg-white rounded-md shadow-md">
                              {/* Rotation controls */}
                              <button 
                                onClick={() => {
                                  const img = document.getElementById('invoice-image') as HTMLImageElement;
                                  if (img) {
                                    // Get current transform values
                                    const style = window.getComputedStyle(img);
                                    const matrix = new DOMMatrix(style.transform);
                                    
                                    // Extract current rotation angle (if any)
                                    let currentRotation = 0;
                                    const transformValue = img.style.transform;
                                    const rotateMatch = transformValue.match(/rotate\(([-0-9]+)deg\)/);
                                    if (rotateMatch && rotateMatch[1]) {
                                      currentRotation = parseInt(rotateMatch[1], 10);
                                    }
                                    
                                    // Calculate new rotation (counter-clockwise)
                                    const newRotation = ((currentRotation - 90) % 360);
                                    
                                    // Apply rotation while preserving other transforms
                                    img.style.transform = `translate(${matrix.e}px, ${matrix.f}px) scale(${matrix.a}) rotate(${newRotation}deg)`;
                                  }
                                }}
                                className="p-2 text-gray-700 hover:bg-gray-100"
                                title="Rotate Counter-Clockwise"
                              >
                                ↺
                              </button>
                              <button 
                                onClick={() => {
                                  const img = document.getElementById('invoice-image') as HTMLImageElement;
                                  if (img) {
                                    // Get current transform values
                                    const style = window.getComputedStyle(img);
                                    const matrix = new DOMMatrix(style.transform);
                                    
                                    // Extract current rotation angle (if any)
                                    let currentRotation = 0;
                                    const transformValue = img.style.transform;
                                    const rotateMatch = transformValue.match(/rotate\(([-0-9]+)deg\)/);
                                    if (rotateMatch && rotateMatch[1]) {
                                      currentRotation = parseInt(rotateMatch[1], 10);
                                    }
                                    
                                    // Calculate new rotation (clockwise)
                                    const newRotation = ((currentRotation + 90) % 360);
                                    
                                    // Apply rotation while preserving other transforms
                                    img.style.transform = `translate(${matrix.e}px, ${matrix.f}px) scale(${matrix.a}) rotate(${newRotation}deg)`;
                                  }
                                }}
                                className="p-2 text-gray-700 hover:bg-gray-100"
                                title="Rotate Clockwise"
                              >
                                ↻
                              </button>
                              
                              {/* Separator */}
                              <div className="border-l border-gray-200 mx-1"></div>
                              
                              {/* Zoom controls */}
                              <button 
                                onClick={() => {
                                  const container = document.getElementById('image-container') as HTMLDivElement;
                                  const img = document.getElementById('invoice-image') as HTMLImageElement;
                                  if (img && container) {
                                    // Get current transform values
                                    const style = window.getComputedStyle(img);
                                    const matrix = new DOMMatrix(style.transform);
                                    const scale = Math.max(matrix.a - 0.2, 0.5); // a is the x-scale
                                    
                                    // Extract current rotation angle (if any)
                                    let currentRotation = 0;
                                    const transformValue = img.style.transform;
                                    const rotateMatch = transformValue.match(/rotate\(([-0-9]+)deg\)/);
                                    if (rotateMatch && rotateMatch[1]) {
                                      currentRotation = parseInt(rotateMatch[1], 10);
                                    }
                                    
                                    // Apply new scale while preserving translation and rotation
                                    img.style.transform = `translate(${matrix.e}px, ${matrix.f}px) scale(${scale}) rotate(${currentRotation}deg)`;
                                  }
                                }}
                                className="p-2 text-gray-700 hover:bg-gray-100"
                                title="Zoom Out"
                              >
                                -
                              </button>
                              <button 
                                onClick={() => {
                                  const img = document.getElementById('invoice-image') as HTMLImageElement;
                                  if (img) {
                                    // Reset zoom and position but keep rotation if any
                                    img.style.transform = 'translate(0px, 0px) scale(1) rotate(0deg)';
                                  }
                                }}
                                className="p-2 text-gray-700 hover:bg-gray-100"
                                title="Reset View"
                              >
                                ⟲
                              </button>
                              <button 
                                onClick={() => {
                                  const container = document.getElementById('image-container') as HTMLDivElement;
                                  const img = document.getElementById('invoice-image') as HTMLImageElement;
                                  if (img && container) {
                                    // Get current transform values
                                    const style = window.getComputedStyle(img);
                                    const matrix = new DOMMatrix(style.transform);
                                    const scale = Math.min(matrix.a + 0.2, 3); // a is the x-scale
                                    
                                    // Extract current rotation angle (if any)
                                    let currentRotation = 0;
                                    const transformValue = img.style.transform;
                                    const rotateMatch = transformValue.match(/rotate\(([-0-9]+)deg\)/);
                                    if (rotateMatch && rotateMatch[1]) {
                                      currentRotation = parseInt(rotateMatch[1], 10);
                                    }
                                    
                                    // Apply new scale while preserving translation and rotation
                                    img.style.transform = `translate(${matrix.e}px, ${matrix.f}px) scale(${scale}) rotate(${currentRotation}deg)`;
                                  }
                                }}
                                className="p-2 text-gray-700 hover:bg-gray-100"
                                title="Zoom In"
                              >
                                +
                              </button>
                            </div>
                            
                            {/* Instructions tooltip */}
                            <div className="absolute bottom-2 left-2 z-10 bg-white bg-opacity-80 text-xs text-gray-700 p-2 rounded-md shadow-sm">
                              Drag to move image • Scroll to zoom • Use ↺/↻ to rotate
                            </div>
                            
                            {/* Image container with pan/zoom functionality */}
                            <div 
                              id="image-container"
                              className="h-full w-full flex items-center justify-center"
                              onMouseDown={(e) => {
                                // Start dragging
                                const container = e.currentTarget;
                                const img = document.getElementById('invoice-image') as HTMLImageElement;
                                if (!img) return;
                                
                                // Get current transform values
                                const style = window.getComputedStyle(img);
                                const matrix = new DOMMatrix(style.transform);
                                
                                // Store initial position
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startTranslateX = matrix.e;
                                const startTranslateY = matrix.f;
                                
                                // Set cursor style
                                container.style.cursor = 'grabbing';
                                
                                // Handle mouse move
                                const handleMouseMove = (moveEvent: MouseEvent) => {
                                  const dx = moveEvent.clientX - startX;
                                  const dy = moveEvent.clientY - startY;
                                  
                                  // Apply translation while preserving scale
                                  img.style.transform = `translate(${startTranslateX + dx}px, ${startTranslateY + dy}px) scale(${matrix.a})`;
                                };
                                
                                // Handle mouse up
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                  container.style.cursor = 'grab';
                                };
                                
                                // Add event listeners
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                              onWheel={(e) => {
                                e.preventDefault();
                                const img = document.getElementById('invoice-image') as HTMLImageElement;
                                if (!img) return;
                                
                                // Get current transform values
                                const style = window.getComputedStyle(img);
                                const matrix = new DOMMatrix(style.transform);
                                
                                // Calculate new scale based on wheel direction
                                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                                const newScale = Math.max(0.5, Math.min(3, matrix.a + delta));
                                
                                // Apply new scale while preserving translation
                                img.style.transform = `translate(${matrix.e}px, ${matrix.f}px) scale(${newScale})`;
                              }}
                              style={{ cursor: 'grab' }}
                            >
                              <img 
                                id="invoice-image"
                                src={`http://localhost:8081${filePath}`} 
                                alt="Invoice Image" 
                                className="max-h-full max-w-full object-contain transition-transform duration-100"
                                style={{ transformOrigin: 'center', transform: 'translate(0px, 0px) scale(1) rotate(0deg)' }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  console.error('Failed to load image');
                                }}
                                draggable="false"
                              />
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 h-full">
                          <div className="mb-6">
                            <div className="w-32 h-32 flex items-center justify-center rounded-full bg-blue-100">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-medium text-gray-800 mb-2">No Invoice Available</p>
                            <p className="text-gray-600 mb-4">Upload an invoice to view it here</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Download button for the invoice */}
                    {filePath && (
                      <div className="p-3 bg-gray-50 border-t border-gray-200">
                        <a 
                          href={`http://localhost:8081${filePath}`} 
                          download
                          className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Original Invoice
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Right side: Extracted Data Form */}
                  <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                    <h3 className="text-lg font-medium text-gray-900 p-4 border-b border-gray-200">Extracted Data</h3>
                    <div className="flex-1 overflow-auto">
                      <InvoiceForm
                        invoiceData={invoiceData}
                        invoiceId={invoiceId}
                        onSaveSuccess={handleSaveSuccess}
                      />
                    </div>
                  </div>
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
