import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom"; 
import { api } from "../../services/api";
import { 
  HiOutlineShoppingBag, 
  HiOutlineArrowRight, 
  HiOutlineArchive,
  HiOutlineSearch,
  HiOutlineSortDescending
} from "react-icons/hi";
import ReceiptModal from "../../components/viewerSide/ReceiptModal";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get("q") || "";
  const sortOrder = searchParams.get("sort") || "newest";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders/my-orders");
        setOrders(response.data);
      } catch (error) {
        console.error("History Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  
  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm) {
      result = result.filter(order => 
        order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, searchTerm, sortOrder]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#3674B5] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#3674B5] rounded-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] bg-[#F8FAFC] flex flex-col overflow-hidden">
      
      <div className="max-w-7xl w-full mx-auto px-6 pt-3 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-[14px] font-bold text-slate-900 tracking-tight mb-1">Purchase History</h1>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Review your past transactions</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Search Bar - Updates URL */}
            <div className="relative w-full sm:w-72 group">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3674B5]" />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => updateParams("q", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-xs focus:ring-2 focus:ring-[#3674B5]/10 focus:border-[#3674B5] outline-none transition-all shadow-sm"
              />
            </div>

            {/* Sort Dropdown - Updates URL */}
            <div className="relative w-full sm:w-44 group">
              <HiOutlineSortDescending className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={sortOrder}
                onChange={(e) => updateParams("sort", e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-11 pr-4 text-[11px] font-bold text-slate-600 uppercase appearance-none outline-none focus:border-[#3674B5] shadow-sm cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
              <HiOutlineArchive className="text-[#3674B5] w-4 h-4" />
              <span className="text-[11px] font-bold text-slate-900 leading-none">{processedOrders.length} Items</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-20 custom-scrollbar mt-4">
        <div className="max-w-7xl mx-auto">
          {processedOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <HiOutlineShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-500 font-medium">No transactions match your filters.</p>
               {(searchTerm || sortOrder !== "newest") && (
                 <button 
                  onClick={() => setSearchParams({})} 
                  className="mt-2 text-[11px] font-bold text-[#3674B5] uppercase hover:underline"
                 >
                   Reset Filters
                 </button>
               )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
  {processedOrders.map((order) => (
    <div
      key={order.id}
      className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:border-[#3674B5]/40 transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50"
    >
      {/* Top Header: ID & Status */}
      <div className="px-6 pt-6 pb-2 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-col">
          <span className="text-[8px]  font-semibold text-slate-600 uppercase ">Order ID</span>
          <span className="text-[10px] font-bold text-[#3674B5] tracking-tighter">#{order.id.toString().slice(-8)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-semibold text-slate-600 uppercase  mb-1">Status</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-100">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-emerald-700 uppercase">{order.status || 'Settled'}</span>
          </div>
        </div>
      </div>

      {/* Body: Product Name & Price */}
      <div className="px-6 py-2 pb-4  space-y-2">
        <div>
          <span className="text-[8px] font-semibold text-slate-600 uppercase ">Product Name</span>
          <h3 className="text-xs font-bold text-slate-800 leading-snug uppercase tracking-tight line-clamp-2 mt-1 min-h-[32px]">
            {order.product_name}
          </h3>
        </div>

        {/* Info Grid: Quantity & Date */}
        <div className="grid grid-cols-2 gap-4 py-1 border-y border-slate-50">
          <div className="flex flex-col">
            <span className="text-[8px] font-semibold text-slate-600 uppercase tracking-tighter">Units / Qty</span>
            <span className="text-[11px] font-bold text-slate-700 mt-0.5 uppercase">
              {order.quantity} <span className="text-slate-600 font-medium text-[9px]">Units</span>
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[8px] font-semibold text-slate-600 uppercase tracking-tighter">Amount Paid</span>
            <span className="text-[13px] font-black text-slate-900 mt-0.5 italic">
              ₹{parseFloat(order.total_price).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Footer: Date & Button */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex flex-col">
             <span className="text-[8px] font-semibold text-slate-600 uppercase tracking-tighter">Transaction Date :</span>
             <span className="text-[10px] font-bold text-slate-500 uppercase italic">
                {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
             </span>
          </div>

          <button
            onClick={() => setViewingOrder(order)}
            className="h-10 px-4 bg-[#3674B5] rounded-lg text-white font-semibold group-hover:bg-[#3674B5] transition-all duration-300 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"
          >
            Receipt
            <HiOutlineArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  ))}
</div>
          )}
        </div>
      </div>

      {viewingOrder && (
        <ReceiptModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
      )}
    </div>
  );
};

export default OrderHistory;