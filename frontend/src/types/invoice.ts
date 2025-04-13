export interface VendorInfo {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
}

export interface CustomerInfo {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  account_number: string | null;
}

export interface LineItem {
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  product_code: string | null;
  tax_rate: number | null;
  category: string | null;
}

export interface Flags {
  confidence_warning: boolean;
  multi_page_invoice: boolean;
  discrepancy_detected: boolean;
}

export interface InvoiceData {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  purchase_order_number: string | null;
  currency: string | null;
  subtotal: number | null;
  tax: number | null;
  shipping: number | null;
  total: number | null;
  amount_due: number | null;
  vendor: VendorInfo;
  customer: CustomerInfo;
  line_items: LineItem[];
  additional_information: string | null;
  flags: Flags;
}

export interface UploadResponse {
  success: boolean;
  data?: InvoiceData;
  error?: string;
  invoice_id?: string;
  file_path?: string;
}
