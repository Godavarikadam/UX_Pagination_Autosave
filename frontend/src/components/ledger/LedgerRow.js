
import React, { useState } from "react";
import { deleteProduct } from "../../services/productApi";
import { FiEdit3, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

function LedgerRow({ product, isSelected, onCheckboxToggle, onRowClick, isAdmin, onDeleteSuccess, pendingChanges }) {
  const [deleting, setDeleting] = useState(false);

const renderCell = (fieldName, currentValue, prefix = "") => {
  const pending = pendingChanges?.find(r => r.field_name === fieldName);

  if (pending) {
    return (
      // 🟢 'flex-col' is required to stack the Ghost and the New value
      // 🟢 'items-center' or 'items-start' ensures they align correctly
      <div className="flex flex-col items-center justify-center min-h-[40px] leading-tight">
        {/* Ghost Value */}
        <span className="text-[10px] text-slate-400 line-through opacity-60">
          {prefix}{currentValue}
        </span>
        
        {/* New Proposed Value */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[12px] font-bold text-amber-600 italic">
            {prefix}{pending.new_value}
          </span>
          {/* Pulsing Amber Dot */}
          <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }
  return <span className="text-[12px] font-medium">{prefix}{currentValue}</span>;
};

  const handleDelete = (e) => {
    if (deleting) return;
    // ... (Your existing toast logic)
    toast((t) => (
      <div className="flex items-center gap-3 min-w-[280px]">
        <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
          <FiTrash2 className="w-4 h-4 text-rose-600" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-bold text-gray-900 leading-tight">Confirm Deletion</p>
          <p className="text-[10px] block text-gray-500 mt-0.5 truncate max-w-[140px]">
            #{product.id} : {product.name}
          </p>
        </div>
        <div className="flex items-center gap-2 border-l border-gray-100 pl-3">
          <button onClick={() => toast.dismiss(t.id)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-all">
            <FiX size={16} />
          </button>
          <button onClick={() => { toast.dismiss(t.id); executeDelete(); }} className="bg-rose-600 text-white px-3 py-1.5 rounded-md text-[10px] font-semibold hover:bg-rose-700 shadow-sm active:scale-95 transition-all">
            DELETE
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-right', className: 'border border-gray-100 shadow-xl rounded-xl' });
  };

  const executeDelete = async () => {
    setDeleting(true);
    const loadingToast = toast.loading(`Removing ${product.name}...`);
    try {
      await deleteProduct(product.id);
      toast.success("Product deleted!", { id: loadingToast });
      window.dispatchEvent(new Event("activityUpdated"));
      onDeleteSuccess?.(product.id);
    } catch (err) {
      toast.error("Failed to remove product.", { id: loadingToast });
      setDeleting(false);
    }
  };

  return (
    <tr className={`hover:bg-blue-50/30 transition-colors group ${pendingChanges?.length > 0 ? 'bg-amber-50/10' : ''}`}>
      {isAdmin && (
        <td className="w-[50px] px-4 py-3 text-center border border-slate-200">
          <input 
            type="checkbox"
            className="cursor-pointer accent-[#3674B5] w-3 h-3"
            checked={isSelected}
            onChange={(e) => onCheckboxToggle(e)}
            onClick={(e) => e.stopPropagation()} 
          />
        </td>
      )}

      <td className="w-20 px-6 py-3 text-[12px] font-semibold text-[#3674B5] border border-slate-200">
        #{product.id}
      </td>
      
      {/* 🟢 Name Cell with Ghost Logic */}
      <td className="px-6 py-3 w-60 font-medium text-gray-600 border border-slate-200">
        {renderCell('name', product.name)}
      </td>
  
      {/* 🟢 Quantity Cell with Ghost Logic */}
      <td className="px-10 w-20 py-3 text-gray-600 border border-slate-200">
        {renderCell('quantity', product.quantity)}
      </td>
    
      {/* 🟢 Price Cell with Ghost Logic */}
      <td className="px-10 w-20 py-3 text-gray-600 font-semibold border border-slate-200">
        {renderCell('unit_price', Number(product.unit_price || product.unitPrice).toLocaleString(), "Rs.")}
      </td>

      <td className="px-2 w-20 py-3 text-center border border-slate-200">
        <button
          onClick={() => onRowClick(product)}
          className="p-1.5 text-[#3674B5] hover:text-[#3674B5] hover:bg-[#3674B5]/10 rounded-md transition-all"
        >
          <FiEdit3 size={13} />
        </button>
      </td>

      {isAdmin && (
        <td className="px-1.5 w-20 py-3 text-center border border-slate-200">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`p-1.5 rounded-md transition-all ${
              deleting 
                ? "text-red-300 cursor-not-allowed" 
                : "text-red-400 hover:text-rose-600 hover:bg-rose-50"
            }`}
          >
            <FiTrash2 size={13} />
          </button>
        </td>
      )}
    </tr>
  );
}

export default LedgerRow;