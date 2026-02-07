import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { toast } from "react-hot-toast";
import { HiCheck, HiX, HiSearch, HiFilter, HiOutlineCube } from "react-icons/hi";
import PaginationBar from "../components/ledger/PaginationBar";

function Approval() {
  const { productId, requestId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const searchTerm = searchParams.get("search") || "";
  const filterStatus = searchParams.get("status") || "all";

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- HELPERS ---
  const updateUrl = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params, { replace: true });
  };

  // --- DATA FETCHING ---
  const fetchRequests = async () => {
    // 🟢 ANTI-FLICKER: We don't clear setRequests([]) here. 
    // Old data stays visible until new data arrives.
    setLoading(true);
    try {
      const endpoint = (productId && requestId) 
        ? `/products/approvals/${productId}/${requestId}` 
        : `/products/approvals/list`;
      
      const res = await api.get(endpoint, {
        params: {
          page,
          limit,
          search: searchTerm,
          status: filterStatus
        }
      });

      const items = res.data.items || (Array.isArray(res.data) ? res.data : [res.data]);
      const count = res.data.total || items.length;

      setRequests(items);
      setTotal(count);
    } catch (err) {
      toast.error("Could not load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [productId, requestId, page, limit, searchTerm, filterStatus]);

  const handleAction = async (requestId, decision) => {
    let reason = "";
    if (decision === 'rejected') {
      reason = window.prompt("Enter rejection reason:");
      if (!reason?.trim()) return toast.error("Reason required for rejection");
    }

    try {
      await api.post("/products/approvals/decision", { requestId, decision, reason });
      toast.success(`Request ${decision} successfully`);
      fetchRequests();
      window.dispatchEvent(new Event("activityUpdated"));
    } catch (err) {
      toast.error("Action failed");
    }
  };

  
  const displayedRequests = requests.filter(req => {
    const matchesStatus = filterStatus === "all" || req.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = 
      req.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.entity_id?.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-white shadow-xl shadow-slate-100/40 rounded overflow-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 pb-0 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-[12px] font-semibold text-gray-500">
            Total Items: <span className="text-[#3674B5]">{total}</span>
          </div>

        </div>

        <div className="flex items-center justify-end gap-3 md:ml-auto">
          <div className="relative w-64">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search ID..."
              value={searchTerm}
              onChange={(e) => updateUrl({ search: e.target.value, page: 1 })}
              className="w-full pl-9 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-sm focus:ring-0.5 focus:ring-slate-600 outline-none shadow-sm text-black"
            />
          </div>

          <div className="relative">
            <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select 
              value={filterStatus}
              onChange={(e) => updateUrl({ status: e.target.value, page: 1 })}
              className="pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 uppercase  outline-none focus:ring-0.5 focus:ring-gray-200 appearance-none cursor-pointer shadow-sm"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

     
      <div className="flex-1 flex flex-col px-4 min-h-0 mt-2.5">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20">
  <tr className="bg-gray-100">
    <th className="w-[60px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">REQ ID</th>
    
    {/* Product ID stays small */}
    <th className="w-[100px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">Product ID</th>
    
    {/* NEW: Dedicated Column for the Entity/Field Name */}
    <th className="w-[140px] px-6 py-3 text-[10px] font-black text-gray-900 uppercase border border-slate-300">Target Field</th>
    
    {/* NEW: Dedicated Column for the Data Log */}
    <th className="px-6 py-3 text-[10px] font-black text-gray-900  uppercase border border-slate-300">Value Logs</th>
    
   <th className="w-[200px] px-4 py-3 text-[10px] font-black text-gray-900 uppercase border border-slate-300">
      {filterStatus === 'rejected' ? 'Rejection Reason' : 'Requested By'}
    </th>
    
    <th className={`${(filterStatus === 'approved' || filterStatus === 'rejected') ? 'w-[200px]' : 'w-[140px]'} px-4 py-3 text-[10px] font-black text-gray-900 uppercase border border-slate-300 text-center`}>
      {(filterStatus === 'approved' || filterStatus === 'rejected') ? 'Verified By' : 'Action'}
    </th>
  </tr>
</thead>
            {/* 🟢 Tbody transition: Softens the update by using opacity instead of disappearing */}
           <tbody className={`divide-y divide-slate-300 transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>

            {displayedRequests.length === 0 && !loading ? (
    /* 🟢 PROFESSIONAL EMPTY STATE FOR BLANK PAGES */
    <tr>
      <td colSpan="6" className="py-24 text-center bg-slate-50/20">
        <div className="flex flex-col items-center justify-center">
         
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
            No Requests Found
          </h3>
          <p className="text-[11px] text-slate-400 mt-2 max-w-[280px] mx-auto leading-relaxed">
            {searchTerm 
              ? `No results matching "${searchTerm}". Try a different search term or filter.` 
              : `There are currently no ${filterStatus !== 'all' ? filterStatus : ''} approval requests to display.`}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => navigate('/products')}
              className="mt-6 px-5 py-2 bg-[#3674B5] font-semibold text-white text-[10px]  uppercase rounded-lg hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              Go to Product List
            </button>
          )}
        </div>
      </td>
    </tr>
  ) : (
  displayedRequests.map(req => (
    <tr key={req.id} className="group hover:bg-slate-50/80 transition-colors">
      {/* REQ ID */}
      <td className="px-4 py-4  text-center text-[12px] text-gray-600 border border-slate-200 bg-slate-50/30">
        {req.id}
      </td>



      <td className="px-4 py-3 text-center border border-slate-200">
        <span className="text-[12px] text-gray-600 font-semibold">
          #{req.entity_id}
        </span>
      </td>


      <td className="px-6 py-3 border border-slate-200 ">
        <span className="text-[12px] font-black text-[#3674B5] font-semibold px-2 py-1 rounded ">
          {req.field_name?.replace('_', ' ')}
        </span>
      </td>

   <td className="px-6 py-3 border border-slate-300">
  <div className="flex gap-3 text-[12px]">
    <div className="flex mt-1 flex-col">
      <span className="text-slate-500 line-through italic truncate max-w-[120px]">
        {req.old_value || 'NULL'}
      </span>
    </div>

    <span className="text-[#3674B5] font-bold text-lg">→</span>

    <div className="flex mt-1 flex-col">
      <span className="text-emerald-700 font-bold truncate max-w-[150px]">
        {req.new_value}
      </span>
    </div>
  </div>
</td>


<td className="w-[200px] px-4 py-3 border border-slate-200">
  {filterStatus === 'rejected' ? (
    /* 1. Show Rejection Reason if the filter is set to 'rejected' */
    <div className="flex flex-col">
      <span className="text-[11px] text-rose-600 font-bold italic leading-tight">
        {req.rejection_reason || "No reason provided"}
      </span>
      
    </div>
  ) : (
    /* 2. Show Requested By for all other filters */
    <div className="flex flex-col">
      <span className="text-[12px] text-gray-600 font-semibold">
        {req.requester_name||"unknown"}
      </span>
      <span className="text-[11px] text-gray-400">
        {new Date(req.created_at).toLocaleDateString()}
      </span>
    </div>
  )}
</td>


<td className="px-4 py-3 border border-slate-200">
  {(() => {
    // CASE 1: When filtering by "All Requests"
    if (filterStatus === 'all') {
      if (req.status === 'approved') {
        return (
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5 font-semibold  text-emerald-600  rounded text-[12px] font-black">
              Approved
            </span>
           
          </div>
        );
      }
      if (req.status === 'rejected') {
        return (
          <div className="flex flex-col items-center">
            <span className="px-2 py-0.5  text-rose-600 font-semibold rounded text-[12px] font-black ">
              Rejected
            </span>
            <span className="text-[9px] bg-rose-50 px-2 py-1 font-semibold text-rose-600 italic mt-0.5 truncate max-w-[100px]" title={req.rejection_reason}>
              {req.rejection_reason}
            </span>
          </div>
        );
      }
    }

    // CASE 2: When specifically in "Approved" or "Rejected" tabs, show ONLY the name
    if (filterStatus === 'approved' || filterStatus === 'rejected') {
      return (
        <div className="flex flex-col ">
          <span className="text-[12px] text-gray-600 lowercase font-semibold  truncate">
            {req.admin_name|| "System"}
          </span>
          <span className="text-[11px] text-gray-400">
        {new Date(req.updated_at).toLocaleDateString()}
      </span>
         
        </div>
      );
    }

    // CASE 3: For Pending items (either in "All" or "Pending" filter)
    return (
      <div className="flex justify-center gap-2">
        <button 
          onClick={() => handleAction(req.id, 'approved')} 
          className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 shadow-sm active:scale-95 transition-transform"
        >
          <HiCheck size={16}/>
        </button>
        <button 
          onClick={() => handleAction(req.id, 'rejected')} 
          className="p-1.5 bg-white text-rose-500 border border-rose-200 rounded hover:bg-rose-50 shadow-sm active:scale-95 transition-transform"
        >
          <HiX size={16}/>
        </button>
      </div>
    );
  })()}
</td>

    </tr>
  ))
)}
</tbody>


          </table>
        </div>

        {/* PAGINATION BAR SECTION - Fixed at bottom outside the scroll div */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white ">
          <PaginationBar
            page={page}
            limit={limit}
            totalPages={Math.max(Math.ceil(total / limit), 1)}
            setPage={(p) => updateUrl({ page: p })}
            setLimit={(l) => updateUrl({ page: 1, limit: l })}
          />
        </div>
      </div>

    </div>
  );
}

export default Approval;