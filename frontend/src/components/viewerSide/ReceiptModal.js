import React from "react";
import { HiOutlineShoppingBag, HiX, HiOutlinePrinter } from "react-icons/hi";

const ReceiptModal = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 flex flex-col">
        
        {/* Minimal Header */}
        <div className="px-6 py-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
              <HiOutlineShoppingBag className="w-4 h-4 text-[#3674B5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.1em]">Transaction Record</p>
            
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-full transition-all text-slate-600 hover:text-slate-900">
            <HiX className="w-4 h-4" />
          </button>
        </div>

        {/* Content Section */}
        <div className="px-8 py-6 space-y-8" id="printable-invoice">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">User ID</p>
              <p className="text-xs font-bold text-slate-900">#{order.id.toString().slice(-12)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Status</p>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                {order.status || 'Verified'}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Date</p>
              <p className="text-xs font-bold text-slate-900 uppercase">
                {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Time</p>
              <p className="text-xs font-bold text-slate-900 uppercase">
                {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>

          {/* Item Breakdown */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">Summary</p>
              <div className="h-[1px] flex-1 mx-4 bg-slate-50 mb-1"></div>
            </div>
            
            <div className="flex justify-between items-center group">
              <div>
                <h4 className="text-sm font-bold text-slate-900  mb-2 tracking-tight">{order.product_name}</h4>
                <p className="text-[10px] text-slate-600 font-medium">Qty: {order.quantity} units</p>
              </div>
              <p className="text-sm font-bold text-slate-900">₹{parseFloat(order.total_price).toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-2">
               <div className="flex justify-between text-[10px] font-medium text-slate-600">
                  <span>Net Subtotal</span>
                  <span>₹{parseFloat(order.total_price).toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-[10px] font-medium text-slate-600">
                  <span>Fees & Adjustments</span>
                  <span>₹0.00</span>
               </div>
               <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Total Value</span>
                  <span className="text-lg font-black text-[#3674B5]">₹{parseFloat(order.total_price).toLocaleString('en-IN')}</span>
               </div>
            </div>
          </div>

        </div>

        {/* Action Bar */}
        <div className="p-6 pt-0 grid grid-cols-2 gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest"
          >
            <HiOutlinePrinter className="w-3.5 h-3.5" /> Print
          </button>

           <button 
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest"
          >Cancel
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;