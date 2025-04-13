
# 📄 Invoice Extraction Report: Field Descriptions

This document defines the fields returned by the invoice extraction system. The report is structured in JSON format and captures key invoice data in a standardized way, even across varying layouts, formats, or languages.

---

## 🧾 Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `invoice_number` | `string` or `null` | The unique identifier assigned to the invoice. Look for labels such as "Invoice No.", "Bill Number", or equivalents. |
| `invoice_date` | `string` (YYYY-MM-DD) or `null` | The date the invoice was issued. Must be normalized to ISO 8601 format (`YYYY-MM-DD`). |
| `due_date` | `string` (YYYY-MM-DD) or `null` | The deadline for payment. May appear as "Due By", "Payment Due", etc. |
| `purchase_order_number` | `string` or `null` | An optional reference number for a related purchase order. |
| `currency` | `string` (ISO 4217) or `null` | Three-letter currency code (e.g., `USD`, `EUR`). Inferred from symbols or labels (e.g., `$`, "Total in USD"). |
| `subtotal` | `float` or `null` | The total amount before tax and shipping. |
| `tax` | `float` or `null` | The total tax applied across line items. May be inferred even if not explicitly labeled. |
| `shipping` | `float` or `null` | Additional shipping or handling fees. |
| `total` | `float` or `null` | The grand total of the invoice including tax and shipping. |
| `amount_due` | `float` or `null` | The amount currently owed. May differ from `total` if prior payments were made. |

---

## 🏢 Vendor Information

Describes the sender of the invoice (the supplier or service provider).

```json
"vendor": {
  "name": null,
  "address": null,
  "phone": null,
  "email": null,
  "tax_id": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` or `null` | The vendor or billing entity's name. |
| `address` | `string` or `null` | Physical or mailing address. |
| `phone` | `string` or `null` | Vendor’s contact phone number. |
| `email` | `string` or `null` | Vendor’s billing or general contact email. |
| `tax_id` | `string` or `null` | Tax identification number (e.g., EIN, VAT number). |

---

## 🧑‍💼 Customer Information

Describes the recipient of the invoice (the billed party or client).

```json
"customer": {
  "name": null,
  "address": null,
  "phone": null,
  "email": null,
  "account_number": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` or `null` | Customer or client name. |
| `address` | `string` or `null` | Customer billing or shipping address. |
| `phone` | `string` or `null` | Customer phone number. |
| `email` | `string` or `null` | Customer email. |
| `account_number` | `string` or `null` | Customer's internal account or reference number. |

---

## 📦 Line Items

A list of goods or services listed on the invoice.

```json
"line_items": [
  {
    "description": null,
    "quantity": null,
    "unit_price": null,
    "total_price": null,
    "product_code": null,
    "tax_rate": null,
    "category": null
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` or `null` | Text describing the item or service. |
| `quantity` | `float` or `null` | Number of units ordered or billed. |
| `unit_price` | `float` or `null` | Price per unit of the item or service. |
| `total_price` | `float` or `null` | Total cost for this line item (unit price × quantity). |
| `product_code` | `string` or `null` | Internal SKU, product number, or reference code. |
| `tax_rate` | `float` or `null` | Tax rate (as a decimal, e.g., `0.07` for 7%) applicable to this item. |
| `category` | `string` or `null` | Optional classification of item (e.g., `"software"`, `"equipment"`, `"logistics"`). May be inferred. |

---

## 🗒 Additional Information

| Field | Type | Description |
|-------|------|-------------|
| `additional_information` | `string` or `null` | A free-text field capturing **non-structured** but relevant details, such as:<br>- Payment terms (e.g., Net 30)<br>- Remittance instructions<br>- Legal disclaimers<br>- Return/refund policies<br>- Bank account or wire info<br>- Footnotes or special conditions |

---

## 🚩 Flags

A top-level object indicating **issues or special cases** detected during extraction.

```json
"flags": {
  "confidence_warning": true,
  "multi_page_invoice": true,
  "discrepancy_detected": true
}
```

| Flag | Type | Description |
|------|------|-------------|
| `confidence_warning` | `boolean` | Set to `true` if some fields had ambiguous or conflicting values (e.g., multiple invoice dates, partial totals). Use caution when relying on this result. |
| `multi_page_invoice` | `boolean` | Indicates the invoice spans more than one page/image. Content may be split across pages or partially obscured. |
| `discrepancy_detected` | `boolean` | Set to `true` if the `total` does not match the sum of `subtotal + tax + shipping`, or if line items do not add up to the reported total. Indicates a potential inconsistency. |
