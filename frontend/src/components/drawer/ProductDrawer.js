import React, { useState, useEffect, useContext, useRef } from "react";
import { api } from "../../services/api"
import { useAutoSave } from "../../hooks/useAutoSave";
import { AuthContext } from "../../context/AuthContext";
import { addProduct, getSettings } from "../../services/productApi";
import toast from "react-hot-toast";
import axios from "axios";
import { parseFunction } from "../dynamic/utils/functionParser";
import { PRODUCT_MAPPING } from "../dynamic/utils/columnMapper";
import FormField from "../dynamic/FormField";

function ProductDrawer({ product, isOpen, onClose, readOnly = false, onUpdate }) {
  const { user } = useContext(AuthContext);
  const [localProduct, setLocalProduct] = useState(product);
  const [displayStatus, setDisplayStatus] = useState("idle");
  const [isClosing, setIsClosing] = useState(false);


  const [entities, setEntities] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  const lastConfirmedProduct = useRef(product);
  const isNew = product && !product.id;


  useEffect(() => {
    if (isOpen) {
      const fetchDynamicSchema = async () => {
        setIsLoadingSchema(true);
        try {
          const res = await api.get("/forms/get/product-form");
          const schemaData = res.data?.entities || [];

          const hydrated = schemaData.map(field => ({
            ...field,
            parsed: parseFunction(field.jsSource, field.required),
          }));
          setEntities(hydrated);
        } catch (err) {
          console.error("Failed to load dynamic schema", err);
          toast.error("Could not load validation rules");
        } finally {
          setIsLoadingSchema(false);
        }
      };
      fetchDynamicSchema();
    }
  }, [isOpen]);


  useEffect(() => {
    if (product && product.id !== localProduct?.id) {
      setLocalProduct(product);
      lastConfirmedProduct.current = product;
      setDisplayStatus("idle");
      setIsClosing(false);
    }
  }, [product?.id]);


  // 🟢 CHANGE: Add a check to disable autosave if the status is 'rejected'
  const isRejected = localProduct?.current_request_status === 'rejected';

  const { value: formData, setValue: setFormData, saveStatus } =
    useAutoSave(
      (!isNew && !isRejected) ? localProduct?.id : null,
      (!isNew && !isRejected) ? localProduct : null
    );

  // Status Indicator Logic (Keep your existing autosave UI)
  useEffect(() => {
    if (!saveStatus || readOnly || isNew || isClosing) return;
    let timer;
    if (saveStatus === "typing") {
      setDisplayStatus("typing");
      timer = setTimeout(() => setDisplayStatus("saving"), 700);
    } else if (saveStatus === "saving") {
      setDisplayStatus("saving");
    } else if (saveStatus === "saved") {
      setDisplayStatus("saved");
      lastConfirmedProduct.current = localProduct;
      timer = setTimeout(() => setDisplayStatus("idle"), 2000);
    } else if (saveStatus === "error") {
      setDisplayStatus("error");
      toast.error("Auto-save failed.");
      setLocalProduct(lastConfirmedProduct.current);
      timer = setTimeout(() => setDisplayStatus("idle"), 3000);
    }
    return () => clearTimeout(timer);
  }, [saveStatus, readOnly, isClosing, isNew, localProduct?.id]);

  const handleChange = (dbKey, value, fieldObject) => {
    const isPendingForUser = !isNew && localProduct.current_request_status === 'pending' && user.role !== 'admin';

    if (readOnly || isClosing || isPendingForUser) return;

    let err = null;
    if (fieldObject.parsed?.validate) {
      err = fieldObject.parsed.validate(value);
    }

    if (!err && fieldObject.required) {
      const isEmpty = Array.isArray(value)
        ? value.length === 0
        : (value === null || value === undefined || String(value).trim() === "");
      if (isEmpty) err = `${fieldObject.label} is required`;
    }

    setFieldErrors(prev => ({ ...prev, [dbKey]: err }));

    // 1. Update UI state so the user sees their typing
    const updated = {
      ...localProduct,
      [dbKey]: value,
      current_request_status: localProduct.current_request_status === 'rejected' ? 'idle' : localProduct.current_request_status
    };
    setLocalProduct(updated);
    // 2. Comparison Logic
    const oldValue = JSON.stringify(lastConfirmedProduct.current?.[dbKey] ?? "");
    const newValue = JSON.stringify(value ?? "");

    if (!isNew && !err && oldValue !== newValue) {
      // 🟢 CHANGE: Send ONLY the changed field to prevent backend loop bloat
      setFormData({ [dbKey]: value });

      // 🟢 UPDATE REF: This prevents the "Typing Log Explosion"
      lastConfirmedProduct.current = updated;
    }
  };

  const handleImmediateClose = () => {
    setIsClosing(true);
    if (!isNew) onUpdate?.(lastConfirmedProduct.current, false);
    onClose();
  };

  const handleDone = async () => {
    const dynamicErrors = {};
    let overallFormHasError = false;

    entities.forEach(f => {
      const key = f.dbKey || PRODUCT_MAPPING[f.label] || f.label.toLowerCase();
      const val = localProduct[key];
      let currentFieldError = null;

      // 🟢 Fix 1: Added () to .trim()
      const isEmpty = val === null || val === undefined || String(val).trim() === "";

      // Bypass logic: Agar required nahi hai aur khali hai, toh skip karo
      const skipValidations = !f.required && isEmpty;

      if (!skipValidations) {
        // A. Priority 1: Custom JS logic
        if (f.parsed?.validate) {
          currentFieldError = f.parsed.validate(val);
        }

        // B. Priority 2: Standard Required Check
        if (!currentFieldError && f.required === true) {
          if (isEmpty) {
            currentFieldError = `${f.label} is required`;
          }
        }
      }

      // 3. Update Error Object
      if (currentFieldError) {
        dynamicErrors[key] = currentFieldError;
        overallFormHasError = true;
      } else {
        // 🟢 Fix 2: Sirf specific key ko null set karein, pure object ko nahi
        dynamicErrors[key] = null;
      }
    });

    setFieldErrors(dynamicErrors);

    if (overallFormHasError) {
      return toast.error("Please fix errors");
    }

    // --- Success Path ---
    if (isNew) {
      const loadingToast = toast.loading(user.role === 'admin' ? "Creating product..." : "Submitting for approval...");
      try {
        if (user.role !== 'admin') {
          const payload = {
            entity_id: 0,
            field_name: "CREATE_NEW_PRODUCT",
            old_value: null,
            new_value: JSON.stringify(localProduct),
            updated_by: user.id
          };
          await api.post("/products/approvals", payload);

          toast.success("Request sent to Admin!", { id: loadingToast });
        }
        else {
          const payload = { ...localProduct, updated_by: user.id };
          const res = await addProduct(payload);
          toast.success("Product added live!", { id: loadingToast });
          onUpdate?.(res.data, true);
        }

        setIsClosing(true);
        onClose();
      } catch (err) {
        console.error("Submission error:", err);
        toast.error(err.response?.data?.message || "Action failed", { id: loadingToast });
      }
    }
  };

  const getStatusStyle = () => {
    if (isClosing) return "hidden";
    switch (displayStatus) {
      case "typing": return "bg-white text-[#578FCA] animate-pulse";
      case "saving": return "bg-white text-[#FD8A6B] animate-pulse";
      case "saved": return "bg-white text-[#3674B5]";
      default: return "hidden";
    }
  };

  if (!isOpen || !localProduct) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleImmediateClose} />

      <div className="relative p-2 flex flex-col w-full max-w-lg max-h-[85vh] bg-[#F9FAFB] border-2 border-[#3674B5] shadow-2xl rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
          <div>
            <h2 className="text-[12px] font-semibold text-[#3674B5] uppercase">
              {isNew ? "Create Product" :
                localProduct.current_request_status === 'rejected' ? "Resubmit Product" : "Edit Product"}
            </h2>
            <p className="text-[9px] text-[#3674B5] font-bold">
              {isNew ? "NEW ENTRY" : `ID: #${localProduct.id}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && !isNew && (
              <div className={`px-2 py-1 rounded-md text-[9px] font-black border transition-all ${getStatusStyle()}`}>
                {displayStatus.toUpperCase()}
              </div>
            )}
            <button onClick={handleImmediateClose} className="rounded-md p-1 text-gray-500 hover:bg-gray-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        {/* BODY: Dynamic Form Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-white custom-scrollbar">

          {/* STATUS BANNER: Role-Aware Context */}
          {!isNew && (localProduct.current_request_status === 'pending' || localProduct.current_request_status === 'rejected') && (
            <div className={`p-3 rounded-md border flex items-start gap-3 ${localProduct.current_request_status === 'pending' ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
              }`}>
              <div className={`mt-1 w-2 h-2 rounded-full animate-pulse ${localProduct.current_request_status === 'pending' ? "bg-amber-500" : "bg-red-500"
                }`} />
              <div className="flex-1">
                <p className={`text-[11px] font-bold uppercase ${localProduct.current_request_status === 'pending' ? "text-amber-800" : "text-red-800"
                  }`}>
                  {/* Branch text based on ROLE */}
                  {user.role === 'admin'
                    ? (localProduct.current_request_status === 'pending' ? "Action Required: Review this change" : "Request rejected")
                    : (localProduct.current_request_status === 'pending' ? "Request is under review" : "Correction Needed")}
                </p>

                {localProduct.current_request_status === 'rejected' && (
                  <p className="text-[10px] text-red-600 font-medium italic mt-0.5">
                    Reason: {localProduct.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          )}

          {isLoadingSchema ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-9 h-9 border-[3px] border-slate-100 border-t-[#3674B5] rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applying Field Logic...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-1">
              {entities.map((f, i) => {
                const key = f.dbKey || PRODUCT_MAPPING[f.label] || f.label.toLowerCase();

                // 🟢 FIX: Case-insensitive check for "Description"
                const labelLower = f.label?.toLowerCase().trim();
                const isDescription = labelLower === "description";
                const isProductName = labelLower === "name" || labelLower === "product name";

                return (
                  <div
                    key={key}
                    // Full width for Description and Name
                    className={isDescription || isProductName ? "col-span-2" : "col-span-1"}
                  >


                    <FormField
                      index={i}
                      field={{
                        ...f,
                        type: isDescription ? "textarea" : (f.parsed?.type || "text"),
                        options: f.parsed?.options || [],
                        value: localProduct[key] ?? "",
                        required: f.required
                      }}
                      onValueChange={(idx, val) => handleChange(key, val, f)}

                      // 🟢 ADD THIS PROP TO FIX THE ERROR
                      onCheckboxToggle={(idx, val, isChecked) => {
                        const currentArray = Array.isArray(localProduct[key]) ? localProduct[key] : [];
                        const updatedArray = isChecked
                          ? [...currentArray, val]
                          : currentArray.filter(v => v !== val);
                        handleChange(key, updatedArray, f);
                      }}

                      error={fieldErrors[key]}
                      readOnly={readOnly || (!isNew && localProduct.current_request_status === 'pending' && user.eole !== 'admin')}
                    />

                  </div>
                );
              })}
            </div>
          )}

          {/* Audit Information Section */}
          {!isNew && (
            <div className="rounded-lg bg-slate-50 border border-gray-200 p-4 space-y-2 mt-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase ">Update Information</span>
                <span className="text-[10px] bg-white border px-2 py-0.5 rounded text-[#3674B5] font-semibold">USER ID: {localProduct.updated_by || 'SYSTEM'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-400 block text-[9px] uppercase font-semibold">Created</span>
                  <span className="text-gray-700 font-medium text-[10px]">{localProduct.created_at ? new Date(localProduct.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[9px] uppercase font-semibold">Modified</span>
                  <span className="text-gray-700 block text-[10px] font-medium">{localProduct.updated_at ? new Date(localProduct.updated_at).toLocaleDateString() : 'Just now'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER: Role-Aware Button */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={handleImmediateClose} className="...">Cancel</button>

          <button
            onClick={handleDone}
            className={`px-3 py-2 text-white rounded-md text-[11px] font-semibold shadow-sm active:scale-95 transition-all ${user.role === 'admin' ? 'bg-[#3674B5]' : (localProduct.current_request_status === 'rejected' ? 'bg-orange-600' : 'bg-[#3674B5]')
              }`}
          >
            {isNew ? "Add Product" : (
              user.role === 'admin'
                ? "Save Changes" // Admins always save live
                : (localProduct.current_request_status === 'rejected' ? "Fix & Resubmit" : "Submit Update")
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductDrawer;



