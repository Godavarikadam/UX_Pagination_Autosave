import React, { useState } from "react";
import { deleteProduct } from "../../services/productApi";
import { FiEdit3, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

function LedgerRow({ product, isSelected, onCheckboxToggle, onRowClick, isAdmin, onDeleteSuccess, pendingChanges }) {
  const [deleting, setDeleting] = useState(false);

  const renderCell = (fieldName, currentValue, prefix = "") => {
    const pending = pendingChanges?.find(r => r.field_name === fieldName&& r.status === 'pending');
;
    if (pending) {
      return (
        <div className="flex flex-col items-left justify-left min-h-[40px] leading-tight">
         
          <span className="text-[11px] text-slate-500 line-through opacity-60">
            {prefix}{currentValue}
          </span>
          
          
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px] font-bold text-amber-600 italic">
              {prefix}{pending.new_value}
            </span>
          </div>
        </div>
      );
    }
    return <span className="text-[12px] font-medium">{prefix}{currentValue}</span>;
  };

  const handleDelete = (e) => {
    if (deleting) return;
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

  // Determine row background based on status
  const getRowBg = () => {
    if (product.current_request_status === 'pending') return 'bg-amber-50/20';
    if (product.current_request_status === 'rejected') return 'bg-red-50/20';
    if (pendingChanges?.length > 0) return 'bg-amber-50/10';
    return '';
  };

  return (
    <tr className={`hover:bg-blue-50/30 transition-colors group ${getRowBg()}`}>
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

      {/* 🟢 ID Cell with Status Badge */}
      <td className="w-20 px-6 py-3 border border-slate-200">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-semibold text-[#3674B5]">#{product.id}</span>
          {product.current_request_status === 'pending' && (
            <span className="w-fit px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-bold rounded uppercase tracking-tighter">
              Pending
            </span>
          )}
         {product.current_request_status === 'rejected' && (
  <span 
    title={`Reason: ${product.rejection_reason || 'No reason provided'}`} 
    className="w-fit px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-bold rounded uppercase tracking-tighter  "
  >
    Rejected
  </span>
)}
        </div>
      </td>
    
      <td className="px-6 py-3 w-60 font-medium text-gray-600 border border-slate-200">
        <div className="flex flex-col">
          {renderCell('name', product.name)}
        
        </div>
      </td>
  
 
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