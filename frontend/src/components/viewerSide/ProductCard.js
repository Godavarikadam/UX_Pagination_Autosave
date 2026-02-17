import React, { useState } from "react";
import { HiOutlineShoppingCart } from "react-icons/hi";

const ProductCard = ({ product, onBuy, isLoading }) => {
  const [qty, setQty] = useState(1);

  const increment = (e) => {
    e.stopPropagation();
    if (qty < product.quantity) setQty(qty + 1);
  };

  const decrement = (e) => {
    e.stopPropagation();
    if (qty > 1) setQty(qty - 1);
  };

  const isOutOfStock = product.quantity <= 0;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover-border-slate-400 hover:shadow-xl transition-all group">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-mono bg-gray-100  text-slate-900 px-3 py-1 rounded text-slate-400 tracking-tighter"> PRODUCT ID: {product.id}</span>
        <div className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
      </div>

<div className="flex flex-col gap-1 mb-3">
  <h3 className="text-[16px] font-semibold font-black text-slate-800 group-hover:text-[#3674B5] transition-colors line-clamp-1">
    {/* Clean up name if it contains brackets/quotes */}
    {product.name.replace(/[{}"]/g, "").trim()}
  </h3>
  <span className="text-[8px] font-bold text-[#3674B5] uppercase ">
    {/* Clean up category and handle fallback */}
    {(product.category || "General").replace(/[{}"]/g, "").trim()}
  </span>
</div>
      <div className="mt-auto border-t border-slate-50 pt-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-semibold text-slate-600 uppercase">Unit Price</p>
            <p className="text-[14px] font-semibold text-slate-900">Rs. {product.unit_price}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-600 uppercase">Available</p>
            <p className={`text-[14px] font-semibold ${product.quantity < 5 ? 'text-red-500' : 'text-slate-800'}`}>
              {product.quantity}
            </p>
          </div>
        </div>

        {/* SHOPPING ACTIONS */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 rounded-md p-0,5 border border-slate-200">
            <button 
              onClick={decrement} 
              disabled={isOutOfStock}
              className="p-2 w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-800 hover:text-slate-900 disabled:opacity-20"
            >
              -
            </button>
            <span className="px-3 font-black text-xs text-slate-700 min-w-[24px] text-center">{qty}</span>
            <button 
              onClick={increment} 
              disabled={isOutOfStock}
              className="p-2 w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900 disabled:opacity-20"
            >
              +
            </button>
          </div>
          
          <button 
            disabled={isOutOfStock || isLoading}
            onClick={() => onBuy(product, qty)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-semibold uppercase  transition-all border border-slate-200 ${
              isOutOfStock 
              ? "bg-slate-50 text-slate-400 cursor-not-allowed" 
              : "bg-[#3674B5] text-white text-[8px] font-semibold hover:bg-[#3674B5] active:scale-95 shadow-lg shadow-slate-200"
            }`}
          >
            {isLoading ? "Purchasing..." : isOutOfStock ? "Sold Out" : (
              <>
                <HiOutlineShoppingCart className="w-4 h-4" />
                Buy Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;