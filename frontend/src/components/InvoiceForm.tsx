import React, { useState } from 'react';
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { FiAlertTriangle, FiPlus, FiTrash2, FiSave, FiFileText } from 'react-icons/fi';
import { InvoiceData } from '../types/invoice';
import { submitCorrections } from '../services/api';

interface InvoiceFormProps {
  invoiceData: InvoiceData;
  invoiceId: string;
  onSaveSuccess: (updatedData: InvoiceData) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoiceData, invoiceId, onSaveSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfidenceWarnings, setShowConfidenceWarnings] = useState(true);
  
  // Helper function to check if a field has low confidence
  const hasLowConfidence = (fieldPath: string): boolean => {
    if (!showConfidenceWarnings) return false;
    if (!invoiceData.low_confidence_fields) return false;
    return invoiceData.low_confidence_fields.includes(fieldPath);
  };
  
  // Helper function to get the appropriate style for a field based on confidence
  const getFieldStyle = (fieldPath: string): string => {
    if (hasLowConfidence(fieldPath)) {
      return "mt-1 block w-full rounded-md border-yellow-500 bg-yellow-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700";
    }
    return "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700";
  };

  // Validation schema
  const validationSchema = Yup.object().shape({
    invoice_number: Yup.string().nullable(),
    invoice_date: Yup.string().nullable(),
    due_date: Yup.string().nullable(),
    purchase_order_number: Yup.string().nullable(),
    currency: Yup.string().nullable(),
    subtotal: Yup.number().nullable().typeError('Must be a number'),
    tax: Yup.number().nullable().typeError('Must be a number'),
    shipping: Yup.number().nullable().typeError('Must be a number'),
    total: Yup.number().nullable().typeError('Must be a number'),
    amount_due: Yup.number().nullable().typeError('Must be a number'),
    line_items: Yup.array().of(
      Yup.object().shape({
        description: Yup.string().nullable(),
        quantity: Yup.number().nullable().typeError('Must be a number'),
        unit_price: Yup.number().nullable().typeError('Must be a number'),
        total_price: Yup.number().nullable().typeError('Must be a number'),
      })
    ),
  });

  const handleSubmit = async (values: InvoiceData) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await submitCorrections(invoiceId, values);
      setSaveSuccess(true);
      onSaveSuccess(values);
    } catch (error) {
      console.error('Error saving corrections:', error);
      setSaveError('Failed to save corrections. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {saveSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
          <FiAlertTriangle className="mr-2" /> Corrections saved successfully!
        </div>
      )}

      {saveError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <FiAlertTriangle className="mr-2" /> {saveError}
        </div>
      )}
      
      {invoiceData.low_confidence_fields && invoiceData.low_confidence_fields.length > 0 && showConfidenceWarnings && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiAlertTriangle className="mr-2 text-yellow-600" /> 
              <span>
                <strong>Low confidence fields detected!</strong> The highlighted fields below were extracted with low confidence and may need verification.
              </span>
            </div>
            <button 
              onClick={() => setShowConfidenceWarnings(false)}
              className="ml-4 px-2 py-1 text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded"
            >
              Hide Warnings
            </button>
          </div>
          <div className="mt-2 text-sm">
            <p>Fields with low confidence: {invoiceData.low_confidence_fields.length}</p>
          </div>
        </div>
      )}
      
      {!showConfidenceWarnings && invoiceData.low_confidence_fields && invoiceData.low_confidence_fields.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button 
            onClick={() => setShowConfidenceWarnings(true)}
            className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded flex items-center"
          >
            <FiAlertTriangle className="mr-1 text-yellow-600" /> Show Low Confidence Warnings
          </button>
        </div>
      )}
      
      {invoiceData.flags.confidence_warning && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
          <FiAlertTriangle className="text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800">Low Confidence Warning</h4>
            <p className="text-sm text-yellow-700">
              Some fields may have been extracted with low confidence. Please review carefully.
            </p>
          </div>
        </div>
      )}

      {invoiceData.flags.discrepancy_detected && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <FiAlertTriangle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">Discrepancy Detected</h4>
            <p className="text-sm text-red-700">The calculated total doesn&apos;t match the sum of line items, tax, and shipping.</p>
          </div>
        </div>
      )}

      <Formik
        initialValues={invoiceData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, isValid }) => (
          <Form className="space-y-8">
            {/* Core Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Invoice Details</h3>
                
                <div>
                  <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-800">
                    Invoice Number
                  </label>
                  <Field
                    id="invoice_number"
                    name="invoice_number"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="invoice_number"
                        value={field.value || ''}
                        className={getFieldStyle('invoice_number')}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="invoice_number" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="invoice_date" className="block text-sm font-medium text-gray-800">
                    Invoice Date (YYYY-MM-DD)
                  </label>
                  <Field
                    id="invoice_date"
                    name="invoice_date"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="invoice_date"
                        value={field.value || ''}
                        className={getFieldStyle('invoice_date')}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="invoice_date" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="due_date" className="block text-sm font-medium text-gray-800">
                    Due Date (YYYY-MM-DD)
                  </label>
                  <Field
                    id="due_date"
                    name="due_date"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="due_date"
                        value={field.value || ''}
                        className={getFieldStyle('due_date')}
                      />
                    )}
                  </Field>
                  <ErrorMessage name="due_date" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="purchase_order_number" className="block text-sm font-medium text-gray-800">
                    Purchase Order Number
                  </label>
                  <Field
                    id="purchase_order_number"
                    name="purchase_order_number"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="purchase_order_number"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-800">
                    Currency (ISO code)
                  </label>
                  <Field
                    id="currency"
                    name="currency"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="currency"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Amounts</h3>
                
                <div>
                  <label htmlFor="subtotal" className="block text-sm font-medium text-gray-800">
                    Subtotal
                  </label>
                  <Field
                    id="subtotal"
                    name="subtotal"
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        id="subtotal"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                  <ErrorMessage name="subtotal" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="tax" className="block text-sm font-medium text-gray-800">
                    Tax
                  </label>
                  <Field
                    id="tax"
                    name="tax"
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        id="tax"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                  <ErrorMessage name="tax" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="shipping" className="block text-sm font-medium text-gray-800">
                    Shipping
                  </label>
                  <Field
                    id="shipping"
                    name="shipping"
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        id="shipping"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                  <ErrorMessage name="shipping" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="total" className="block text-sm font-medium text-gray-800">
                    Total
                  </label>
                  <Field
                    id="total"
                    name="total"
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        id="total"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                  <ErrorMessage name="total" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="amount_due" className="block text-sm font-medium text-gray-800">
                    Amount Due
                  </label>
                  <Field
                    id="amount_due"
                    name="amount_due"
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.01"
                        id="amount_due"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                  <ErrorMessage name="amount_due" component="div" className="mt-1 text-sm text-red-600" />
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Vendor Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vendor.name" className="block text-sm font-medium text-gray-800">
                    Vendor Name
                  </label>
                  <Field
                    id="vendor.name"
                    name="vendor.name"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="vendor.name"
                        value={field.value || ''}
                        className={getFieldStyle('vendor.name')}
                      />
                    )}
                  </Field>
                </div>

                <div>
                  <label htmlFor="vendor.tax_id" className="block text-sm font-medium text-gray-800">
                    Tax ID
                  </label>
                  <Field
                    id="vendor.tax_id"
                    name="vendor.tax_id"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="vendor.tax_id"
                        value={field.value || ''}
                        className={getFieldStyle('vendor.tax_id')}
                      />
                    )}
                  </Field>
                </div>
              </div>

              <div>
                <label htmlFor="vendor.address" className="block text-sm font-medium text-gray-800">
                  Address
                </label>
                <Field
                  id="vendor.address"
                  name="vendor.address"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                >
                  {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void } }) => (
                    <textarea
                      {...field}
                      id="vendor.address"
                      rows={2}
                      value={field.value || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                    />
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="vendor.phone" className="block text-sm font-medium text-gray-800">
                    Phone
                  </label>
                  <Field
                    id="vendor.phone"
                    name="vendor.phone"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="vendor.phone"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>

                <div>
                  <label htmlFor="vendor.email" className="block text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <Field
                    id="vendor.email"
                    name="vendor.email"
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="email"
                        id="vendor.email"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Customer Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customer.name" className="block text-sm font-medium text-gray-800">
                    Customer Name
                  </label>
                  <Field
                    id="customer.name"
                    name="customer.name"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="customer.name"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>

                <div>
                  <label htmlFor="customer.account_number" className="block text-sm font-medium text-gray-800">
                    Account Number
                  </label>
                  <Field
                    id="customer.account_number"
                    name="customer.account_number"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="customer.account_number"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>
              </div>

              <div>
                <label htmlFor="customer.address" className="block text-sm font-medium text-gray-800">
                  Address
                </label>
                <Field
                  id="customer.address"
                  name="customer.address"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                >
                  {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void } }) => (
                    <textarea
                      {...field}
                      id="customer.address"
                      rows={2}
                      value={field.value || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                    />
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customer.phone" className="block text-sm font-medium text-gray-800">
                    Phone
                  </label>
                  <Field
                    id="customer.phone"
                    name="customer.phone"
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="text"
                        id="customer.phone"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>

                <div>
                  <label htmlFor="customer.email" className="block text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <Field
                    id="customer.email"
                    name="customer.email"
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                  >
                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                      <input
                        {...field}
                        type="email"
                        id="customer.email"
                        value={field.value || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                      />
                    )}
                  </Field>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Line Items</h3>
              
              <FieldArray name="line_items">
                {({ remove, push }) => (
                  <div className="space-y-4">
                    {values.line_items.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit Price
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Price
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product Code
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tax Rate
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {values.line_items.map((_, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2">
                                  <Field
                                    name={`line_items.${index}.description`}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                                      <input
                                        {...field}
                                        type="text"
                                        value={field.value || ''}
                                        className={getFieldStyle(`line_items.${index}.description`)}
                                      />
                                    )}
                                  </Field>
                                </td>
                                <td className="px-3 py-2">
                                  <Field
                                    name={`line_items.${index}.quantity`}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                                      <input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        value={field.value || ''}
                                        className={getFieldStyle(`line_items.${index}.quantity`)}
                                      />
                                    )}
                                  </Field>
                                </td>
                                <td className="px-3 py-2">
                                  <Field
                                    name={`line_items.${index}.unit_price`}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                                      <input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        value={field.value || ''}
                                        className={getFieldStyle(`line_items.${index}.unit_price`)}
                                      />
                                    )}
                                  </Field>
                                </td>
                                <td className="px-3 py-2">
                                  <Field
                                    name={`line_items.${index}.total_price`}
                                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                                      <input
                                        {...field}
                                        type="number"
                                        step="0.01"
                                        value={field.value || ''}
                                        className={getFieldStyle(`line_items.${index}.total_price`)}
                                      />
                                    )}
                                  </Field>
                                </td>
                                <td className="px-3 py-2">
                                  <Field name={`line_items.${index}.product_code`}>
                                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                                      <input
                                        {...field}
                                        type="text"
                                        id={`line_items.${index}.product_code`}
                                        value={field.value || ''}
                                        className={getFieldStyle(`line_items.${index}.product_code`)}
                                      />
                                    )}
                                  </Field>
                                </td>
                                <td className="px-3 py-2">
                                  <Field name={`line_items.${index}.tax_rate`}>
                                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                                      <input
                                        {...field}
                                        type="number"
                                        id={`line_items.${index}.tax_rate`}
                                        value={field.value || ''}
                                        className={getFieldStyle(`line_items.${index}.tax_rate`)}
                                      />
                                    )}
                                  </Field>
                                </td>
                                <td className="px-3 py-2">
                                  <Field name={`line_items.${index}.category`}>
                                    {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onBlur: (e: React.FocusEvent<HTMLInputElement>) => void } }) => (
                                      <input
                                        {...field}
                                        type="text"
                                        value={field.value || ''}
                                        className={getFieldStyle(`line_items.${index}.category`)}
                                      />
                                    )}
                                  </Field>
                                </td>
                                <td className="px-3 py-2">
                                  <button
                                    type="button"
                                    className="text-red-600 hover:text-red-800"
                                    onClick={() => remove(index)}
                                  >
                                    <FiTrash2 />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => push({
                        description: null,
                        quantity: null,
                        unit_price: null,
                        total_price: null,
                        product_code: null,
                        tax_rate: null,
                        category: null
                      })}
                    >
                      <FiPlus className="mr-2 -ml-1" />
                      Add Line Item
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h3>
              
              <div>
                <label htmlFor="additional_information" className="block text-sm font-medium text-gray-800">
                  Notes, Payment Terms, etc.
                </label>
                <Field name="additional_information">
                  {({ field }: { field: { name: string; value: string | null; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void } }) => (
                    <textarea
                      {...field}
                      id="additional_information"
                      rows={4}
                      value={field.value || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-700"
                    />
                  )}
                </Field>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-5 border-t">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => window.print()}
              >
                <FiFileText className="mr-2 -ml-1" />
                Print / Export
              </button>
              
              <button
                type="submit"
                disabled={isSaving || !isValid}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                <FiSave className="mr-2 -ml-1" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{saveError}</p>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">Changes saved successfully!</p>
              </div>
            )}
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default InvoiceForm;
