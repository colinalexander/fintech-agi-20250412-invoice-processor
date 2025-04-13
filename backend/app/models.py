from typing import List, Optional
from pydantic import BaseModel, Field


class FieldConfidence(BaseModel):
    value: Optional[float] = 1.0  # Default high confidence
    
class VendorInfo(BaseModel):
    name: Optional[str] = None
    name_confidence: Optional[float] = 1.0
    address: Optional[str] = None
    address_confidence: Optional[float] = 1.0
    phone: Optional[str] = None
    phone_confidence: Optional[float] = 1.0
    email: Optional[str] = None
    email_confidence: Optional[float] = 1.0
    tax_id: Optional[str] = None
    tax_id_confidence: Optional[float] = 1.0


class CustomerInfo(BaseModel):
    name: Optional[str] = None
    name_confidence: Optional[float] = 1.0
    address: Optional[str] = None
    address_confidence: Optional[float] = 1.0
    phone: Optional[str] = None
    phone_confidence: Optional[float] = 1.0
    email: Optional[str] = None
    email_confidence: Optional[float] = 1.0
    account_number: Optional[str] = None
    account_number_confidence: Optional[float] = 1.0


class LineItem(BaseModel):
    description: Optional[str] = None
    description_confidence: Optional[float] = 1.0
    quantity: Optional[float] = None
    quantity_confidence: Optional[float] = 1.0
    unit_price: Optional[float] = None
    unit_price_confidence: Optional[float] = 1.0
    total_price: Optional[float] = None
    total_price_confidence: Optional[float] = 1.0
    product_code: Optional[str] = None
    product_code_confidence: Optional[float] = 1.0
    tax_rate: Optional[float] = None
    tax_rate_confidence: Optional[float] = 1.0
    category: Optional[str] = None
    category_confidence: Optional[float] = 1.0


class Flags(BaseModel):
    confidence_warning: bool = False
    multi_page_invoice: bool = False
    discrepancy_detected: bool = False


class InvoiceData(BaseModel):
    invoice_number: Optional[str] = None
    invoice_number_confidence: Optional[float] = 1.0
    invoice_date: Optional[str] = None
    invoice_date_confidence: Optional[float] = 1.0
    due_date: Optional[str] = None
    due_date_confidence: Optional[float] = 1.0
    purchase_order_number: Optional[str] = None
    purchase_order_number_confidence: Optional[float] = 1.0
    currency: Optional[str] = None
    currency_confidence: Optional[float] = 1.0
    subtotal: Optional[float] = None
    subtotal_confidence: Optional[float] = 1.0
    tax: Optional[float] = None
    tax_confidence: Optional[float] = 1.0
    shipping: Optional[float] = None
    shipping_confidence: Optional[float] = 1.0
    total: Optional[float] = None
    total_confidence: Optional[float] = 1.0
    amount_due: Optional[float] = None
    amount_due_confidence: Optional[float] = 1.0
    vendor: VendorInfo = Field(default_factory=VendorInfo)
    customer: CustomerInfo = Field(default_factory=CustomerInfo)
    line_items: List[LineItem] = Field(default_factory=list)
    additional_information: Optional[str] = None
    additional_information_confidence: Optional[float] = 1.0
    flags: Flags = Field(default_factory=Flags)
    low_confidence_fields: List[str] = Field(default_factory=list)


class InvoiceCorrection(BaseModel):
    invoice_id: str
    original_data: InvoiceData
    corrected_data: InvoiceData
    correction_timestamp: str
    user_id: Optional[str] = None
    correction_notes: Optional[str] = None


class UploadResponse(BaseModel):
    success: bool
    data: Optional[InvoiceData] = None
    error: Optional[str] = None
    invoice_id: Optional[str] = None
    file_path: Optional[str] = None
