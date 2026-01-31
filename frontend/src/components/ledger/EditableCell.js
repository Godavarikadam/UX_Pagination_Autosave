import React from "react";
import { useAutoSave } from "../../hooks/useAutoSave";

function EditableCell({ product, field, disabled, onUpdate }) {
  
  const { value, setValue, saveStatus } = useAutoSave(
    product.id, 
    field, 
    product?.[field], 
    onUpdate 
  );

  return (
    <div className="flex items-center gap-2 group">
      <input
        type={field === "quantity" || field === "unit_price" ? "number" : "text"}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className={`w-full bg-transparent border-b border-transparent focus:border-indigo-500 outline-none transition-all ${
          disabled ? "text-slate-400" : "text-slate-700"
        }`}
      />
      <div className="w-4 h-4 flex-shrink-0">
        {saveStatus === "saving" && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
        {saveStatus === "saved" && <span className="text-emerald-500 text-[10px]">✓</span>}
        {saveStatus === "error" && <span className="text-rose-500 text-[10px]">!</span>}
      </div>
    </div>
  );
}

export default EditableCell;