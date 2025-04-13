import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    setIsLoading(false);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return newPageNumber >= 1 && newPageNumber <= (numPages || 1) 
        ? newPageNumber 
        : prevPageNumber;
    });
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  }

  function resetZoom() {
    setScale(1.0);
  }

  return (
    <div className="pdf-viewer flex flex-col h-full">
      {/* Controls */}
      <div className="bg-gray-100 p-3 rounded-t-lg flex flex-wrap items-center justify-between gap-2 border-b border-gray-300">
        <div className="flex items-center space-x-2">
          <button 
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages || '?'}
          </span>
          <button 
            onClick={nextPage}
            disabled={!numPages || pageNumber >= numPages}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={zoomOut}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md"
            title="Zoom In"
          >
            +
          </button>
          <button 
            onClick={resetZoom}
            className="px-2 py-1 bg-white border border-gray-300 rounded-md text-xs"
            title="Reset Zoom"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* PDF Document */}
      <div className="flex-1 overflow-auto bg-gray-200 flex justify-center p-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-600 bg-red-100 p-4 rounded-md">
              {error}
            </div>
          </div>
        )}
        
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="text-center p-4">Loading PDF...</div>}
          error={<div className="text-center p-4 text-red-600">Failed to load PDF</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
