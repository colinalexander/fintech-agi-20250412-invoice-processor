from typing import List, Optional
from pydantic import BaseModel, Field


class VendorInfo(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None


class CustomerInfo(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    account_number: Optional[str] = None


class LineItem(BaseModel):
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    product_code: Optional[str] = None
    tax_rate: Optional[float] = None
    category: Optional[str] = None


class Flags(BaseModel):
    confidence_warning: bool = False
    multi_page_invoice: bool = False
    discrepancy_detected: bool = False


class InvoiceData(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    purchase_order_number: Optional[str] = None
    currency: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    shipping: Optional[float] = None
    total: Optional[float] = None
    amount_due: Optional[float] = None
    vendor: VendorInfo = Field(default_factory=VendorInfo)
    customer: CustomerInfo = Field(default_factory=CustomerInfo)
    line_items: List[LineItem] = Field(default_factory=list)
    additional_information: Optional[str] = None
    flags: Flags = Field(default_factory=Flags)


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
