import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiAlertCircle } from 'react-icons/fi';
import { uploadInvoice } from '../services/api';
import { InvoiceData } from '../types/invoice';

interface FileUploadProps {
  onUploadSuccess: (data: InvoiceData, invoiceId: string, filePath: string) => void;
  onUploadError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10);
    try {
      console.log('Starting file upload process...');
      const formData = new FormData();
      formData.append('file', selectedFile);
      console.log(`File appended to form data: ${selectedFile.name} (${selectedFile.type}, ${selectedFile.size} bytes)`);

      // Simulate progress with detailed status updates
      
      // Simulate progress updates while waiting for API
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          // Cap at 90% until we get actual completion
          const newProgress = Math.floor(prev + Math.random() * 5);
          return newProgress > 90 ? 90 : newProgress;
        });
        
        // Update processing status based on progress
        if (uploadProgress < 30) {
          setProcessingStatus('Uploading invoice...');
        } else if (uploadProgress < 60) {
          setProcessingStatus('Processing invoice...');
        } else if (uploadProgress < 90) {
          setProcessingStatus('Formatting extracted data...');
        } else {
          clearInterval(progressInterval);
        }
      }, 800);

      console.log('Calling uploadInvoice API...');
      const response = await uploadInvoice(selectedFile);
      console.log('API response received:', response);
      
      clearInterval(progressInterval);
      
      if (response.success && response.data && response.invoice_id) {
        setUploadProgress(100);
        setProcessingStatus('Processing complete! Displaying results...');
        
        // Check if the response contains an error message despite success flag
        if (response.error) {
          console.warn('Warning: Response marked as success but contains error:', response.error);
        }
        
        // Check if the invoice data indicates an error condition
        if (response.data.invoice_number?.startsWith('ERROR-')) {
          console.warn('Warning: Response contains error data model');
          onUploadError(response.data.additional_information || 'Error processing invoice');
          return;
        }
        
        // Pass the file path for display
        onUploadSuccess(response.data, response.invoice_id, response.file_path || '');
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Upload error:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      } else if (error instanceof Response) {
        console.error(`HTTP error: ${error.status} ${error.statusText}`);
      } else {
        console.error('Unknown error type:', typeof error);
      }
      
      // Show a more user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to process invoice. Please try again or contact support.';
      
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setProcessingStatus('');
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <FiUpload className="w-12 h-12 text-gray-400" />
          <p className="text-lg font-medium text-gray-700">
            Drag & drop your invoice PDF here
          </p>
          <p className="text-sm text-gray-500">
            or click to select a file
          </p>
        </div>
      </div>

      {selectedFile && !isUploading && (
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-md">
          <div className="flex items-center space-x-3">
            <FiFile className="text-blue-500 w-6 h-6" />
            <div className="flex-1">
              <p className="font-medium text-gray-800">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Process
              </button>
              <button
                onClick={cancelUpload}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-800">{selectedFile?.name}</p>
              <button
                onClick={cancelUpload}
                className="text-gray-500 hover:text-gray-700"
                disabled={uploadProgress >= 100}
              >
                Cancel
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Animated spinner */}
              <div className="relative h-10 w-10 flex-shrink-0">
                <div className="absolute top-0 left-0 h-full w-full border-4 border-blue-200 rounded-full"></div>
                <div 
                  className="absolute top-0 left-0 h-full w-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: '1.5s' }}
                ></div>
              </div>
              
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <p className="font-medium text-blue-700">{processingStatus}</p>
                  <p className="text-gray-600">{Math.floor(uploadProgress)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center text-sm text-gray-500">
        <FiAlertCircle className="mr-2" />
        <span>Supported formats: PDF, PNG, JPG. Maximum size: 10MB.</span>
      </div>
    </div>
  );
};

export default FileUpload;
