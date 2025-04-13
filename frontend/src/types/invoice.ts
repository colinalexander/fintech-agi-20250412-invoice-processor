export interface VendorInfo {
  name: string | null;
  name_confidence?: number;
  address: string | null;
  address_confidence?: number;
  phone: string | null;
  phone_confidence?: number;
  email: string | null;
  email_confidence?: number;
  tax_id: string | null;
  tax_id_confidence?: number;
}

export interface CustomerInfo {
  name: string | null;
  name_confidence?: number;
  address: string | null;
  address_confidence?: number;
  phone: string | null;
  phone_confidence?: number;
  email: string | null;
  email_confidence?: number;
  account_number: string | null;
  account_number_confidence?: number;
}

export interface LineItem {
  description: string | null;
  description_confidence?: number;
  quantity: number | null;
  quantity_confidence?: number;
  unit_price: number | null;
  unit_price_confidence?: number;
  total_price: number | null;
  total_price_confidence?: number;
  product_code: string | null;
  product_code_confidence?: number;
  tax_rate: number | null;
  tax_rate_confidence?: number;
  category: string | null;
  category_confidence?: number;
}

export interface Flags {
  confidence_warning: boolean;
  multi_page_invoice: boolean;
  discrepancy_detected: boolean;
}

export interface InvoiceData {
  invoice_number: string | null;
  invoice_number_confidence?: number;
  invoice_date: string | null;
  invoice_date_confidence?: number;
  due_date: string | null;
  due_date_confidence?: number;
  purchase_order_number: string | null;
  purchase_order_number_confidence?: number;
  currency: string | null;
  currency_confidence?: number;
  subtotal: number | null;
  subtotal_confidence?: number;
  tax: number | null;
  tax_confidence?: number;
  shipping: number | null;
  shipping_confidence?: number;
  total: number | null;
  total_confidence?: number;
  amount_due: number | null;
  amount_due_confidence?: number;
  vendor: VendorInfo;
  customer: CustomerInfo;
  line_items: LineItem[];
  additional_information: string | null;
  additional_information_confidence?: number;
  flags: Flags;
  low_confidence_fields?: string[];
}

export interface UploadResponse {
  success: boolean;
  data?: InvoiceData;
  error?: string;
  invoice_id?: string;
  file_path?: string;
  file_type?: string;
}
