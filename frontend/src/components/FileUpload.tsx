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
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await uploadInvoice(selectedFile);
      clearInterval(progressInterval);
      
      if (response.success && response.data && response.invoice_id && response.file_path) {
        setUploadProgress(100);
        onUploadSuccess(response.data, response.invoice_id, response.file_path);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : 'Failed to upload invoice');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
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

      {selectedFile && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FiFile className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={cancelUpload}
                className="px-3 py-1 text-sm text-gray-600 border rounded hover:bg-gray-100"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isUploading ? 'Processing...' : 'Upload'}
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-500 text-right">
                {uploadProgress < 100
                  ? 'Extracting invoice data...'
                  : 'Processing complete!'}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center text-sm text-gray-500">
        <FiAlertCircle className="mr-2" />
        <p>Supported formats: PDF, PNG, JPG. Maximum size: 10MB.</p>
      </div>
    </div>
  );
};

export default FileUpload;
