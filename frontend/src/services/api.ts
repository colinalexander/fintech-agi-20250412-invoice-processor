import axios from 'axios';
import { InvoiceData, UploadResponse } from '../types/invoice';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadInvoice = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getInvoice = async (invoiceId: string): Promise<InvoiceData> => {
  const response = await api.get<InvoiceData>(`/invoice/${invoiceId}`);
  return response.data;
};

export const submitCorrections = async (
  invoiceId: string, 
  correctedData: InvoiceData, 
  userId?: string, 
  correctionNotes?: string
) => {
  const formData = new FormData();
  formData.append('invoice_id', invoiceId);
  formData.append('corrected_data', JSON.stringify(correctedData));
  
  if (userId) {
    formData.append('user_id', userId);
  }
  
  if (correctionNotes) {
    formData.append('correction_notes', correctionNotes);
  }
  
  const response = await api.post('/corrections', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
