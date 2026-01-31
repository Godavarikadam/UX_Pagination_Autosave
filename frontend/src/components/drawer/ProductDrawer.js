
import React, { useState, useEffect, useContext, useRef } from "react";
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
  
  // 🟢 DYNAMIC STATES
  const [entities, setEntities] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  const lastConfirmedProduct = useRef(product);
  const isNew = product && !product.id;

  // 1. FETCH DYNAMIC SCHEMA (The rules from your Logic Editor)
  useEffect(() => {
    if (isOpen) {
      const fetchDynamicSchema = async () => {
        setIsLoadingSchema(true);
        try {
          const res = await axios.get("http://localhost:5000/api/forms/get/product-form");
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

  // Sync local state when product changes
  useEffect(() => {
    if (product && product.id !== localProduct?.id) {
      setLocalProduct(product);
      lastConfirmedProduct.current = product; 
      setDisplayStatus("idle");
      setIsClosing(false); 
    }
  }, [product?.id]);

  const { value: formData, setValue: setFormData, saveStatus } =
    useAutoSave(!isNew ? localProduct?.id : null, !isNew ? localProduct : null);

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
  if (readOnly || isClosing) return;

  let err = null;

  // 1. Custom JS check
  if (fieldObject.parsed?.validate) {
    err = fieldObject.parsed.validate(value);
  }

  // 2. Dynamic Required Check (Only if fieldObject.required is TRUE)
  if (!err && fieldObject.required) {
    const isEmpty = value === null || value === undefined || String(value).trim() === "";
    if (isEmpty) err = `${fieldObject.label} is required`;
  }

  // 🟢 Error update (it will be null for optional empty fields)
  setFieldErrors(prev => ({ ...prev, [dbKey]: err }));

  const updated = { ...localProduct, [dbKey]: value };
  setLocalProduct(updated);
  
  if (!isNew && !err) {
    setFormData(updated);
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
    const loadingToast = toast.loading("Creating product...");
    try {
      const payload = { ...localProduct, updated_by: user.id };
      const res = await addProduct(payload); 
      toast.success("Product added!", { id: loadingToast });
      onUpdate?.(res.data, true); 
      setIsClosing(true);
      onClose();
    } catch (err) { 
      toast.error("Failed to create", { id: loadingToast }); 
    }
  } else { 
    handleImmediateClose(); 
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
              {isNew ? "Create Product" : "Edit Product"}
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
                // Assign textarea ONLY if it is the description
                type: isDescription ? "textarea" : (f.parsed?.type || "text"),
                options: f.parsed?.options || [],
                value: localProduct[key] ?? "",
                required: f.required
              }}
              onValueChange={(idx, val) => handleChange(key, val, f)}
              error={fieldErrors[key]}
              readOnly={readOnly}
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
        
        {/* FOOTER */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={handleImmediateClose} className="px-3 py-2 bg-gray-200 text-black text-[11px] font-semibold rounded-md border border-gray-400 ">Cancel</button>
          <button onClick={handleDone} className="px-3 py-2 bg-[#3674B5] text-white rounded-md text-[11px] font-semibold shadow-sm active:scale-95 transition-all">
            {isNew ? "Add Product" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDrawer;



