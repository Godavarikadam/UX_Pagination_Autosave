import React, { useState, useEffect } from "react";
import { 
  HiOutlineInformationCircle, 
  HiOutlineX, 
  HiOutlineShoppingCart, 
  HiOutlinePlus, 
  HiOutlineMinus,
  HiOutlineIdentification,
  HiOutlineTag
} from "react-icons/hi";
import { api } from "../../services/api";

const ProductSnapshot = ({ product, isOpen, onClose, mode, onPurchaseSuccess }) => {
  const [activeTab, setActiveTab] = useState(mode);
  const [buyQty, setBuyQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { 
    setActiveTab(mode); 
    setBuyQty(1); 
  }, [mode, isOpen]);

  const allowedFields = [
    { key: 'name', label: 'Product Name' },
    { key: 'quantity', label: 'Available Stock' },
    { key: 'unit_price', label: 'Price' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' }
  ];

  const handleFinalPurchase = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/orders/buy', { 
        productId: product.id, 
        quantity: buyQty 
      });

      if (res.data.success) {
        onPurchaseSuccess(product.id, res.data.newQuantity);
        onClose();
      }
    } catch (err) { 
      alert(err.response?.data?.error || "Transaction failed"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full md:w-[420px] bg-white shadow-xl z-50 transform transition-transform duration-400 border-l border-slate-200 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
      
      {/* Refined Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white">
            <HiOutlineIdentification className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Product Details</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">ID: {product.id}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors">
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>

      {/* Industrial Tabs */}
      <div className="flex bg-slate-50 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === "details" ? "bg-white text-[#3674B5] border-b-2 border-[#3674B5]" : "text-slate-500 hover:text-slate-800"}`}
        >
          Specifications
        </button>
        <button 
          onClick={() => setActiveTab("checkout")}
          className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === "checkout" ? "bg-white text-[#3674B5] border-b-2 border-[#3674B5]" : "text-slate-500 hover:text-slate-800"}`}
        >
          Transaction
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* SPECS VIEW */}
        {activeTab === "details" && (
          <div className="space-y-1 border border-slate-100 rounded-lg overflow-hidden shadow-sm">
            {allowedFields.map((field) => (
              <div key={field.key} className="flex flex-col p-4 bg-white border-b border-slate-50 last:border-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{field.label}</span>
                <span className={`text-slate-700 ${field.key === 'description' ? 'text-[13px] leading-relaxed' : 'text-sm font-semibold'}`}>
                  {field.key === 'unit_price' ? `₹ ${product[field.key]}` : product[field.key] || "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TRANSACTION VIEW */}
        {activeTab === "checkout" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
            
            {/* Simple Receipt Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase">
                <span>Item Subtotal</span>
                <span>₹ {product.unit_price} x {buyQty}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800 uppercase">Total Payable</span>
                <span className="text-lg font-bold text-[#3674B5]">
                  ₹ {(buyQty * product.unit_price).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Quantity Input Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Adjustment</label>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Stock: {product.quantity}</span>
              </div>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-12">
                <button 
                  onClick={() => buyQty > 1 && setBuyQty(buyQty - 1)}
                  className="w-12 h-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 border-r border-slate-200"
                >
                  <HiOutlineMinus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center text-sm font-bold text-slate-800">{buyQty}</div>
                <button 
                  onClick={() => buyQty < product.quantity && setBuyQty(buyQty + 1)}
                  className="w-12 h-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 border-l border-slate-200"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={handleFinalPurchase}
          disabled={isSubmitting || product.quantity <= 0}
          className="w-full bg-slate-900 text-white py-3.5 rounded font-bold text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing..." : "Buy Product"}
        </button>
       
      </div>
    </div>
  );
};

export default ProductSnapshot;