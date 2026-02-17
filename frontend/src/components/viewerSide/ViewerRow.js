import React from "react";
import { HiOutlineArrowRight } from "react-icons/hi";

const ViewerRow = ({ product, onClick }) => {
 
  if (!product) return null;

  const isLowStock = product.quantity < 5;

  return (
    <tr 
      onClick={onClick}
      className="group hover:bg-blue-50/50 transition-all cursor-pointer border-b border-slate-50 last:border-0"
    >
      {/* 1. Asset Name & ID */}
      <td className="p-6">
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-800 group-hover:text-[#3674B5] transition-colors">
            {product.name || "Unnamed Asset"}
          </span>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
            REF-{product.id}
          </span>
        </div>
      </td>

      {/* 2. Volume/Quantity */}
      <td className="p-6 text-center">
        <span className={`text-sm font-bold ${isLowStock ? 'text-red-500' : 'text-slate-600'}`}>
          {product.quantity} units
        </span>
      </td>

      {/* 3. Valuation/Price */}
      <td className="p-6 text-center">
        <span className="text-sm font-black text-slate-700">
          Rs. {product.unit_price}
        </span>
      </td>

      {/* 4. Status & Action */}
      <td className="p-6">
        <div className="flex items-center justify-end gap-4">
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isLowStock 
              ? 'bg-red-50 text-red-500 border border-red-100' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {isLowStock ? 'Priority Alert' : 'In Stock'}
          </div>
          <HiOutlineArrowRight className="text-slate-300 group-hover:text-[#3674B5] group-hover:translate-x-1 transition-all" />
        </div>
      </td>
    </tr>
  );
};

export default ViewerRow;