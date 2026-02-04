import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { toast } from "react-hot-toast";
import { HiCheck, HiX, HiOutlineInformationCircle } from "react-icons/hi";

function Approval() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'approved', 'rejected'

  useEffect(() => {
    const fetchAllRequests = async () => {
      try {
        const res = await api.get('/products/approvals/list');
        setRequests(res.data);
      } catch (err) {
        console.error("Failed to fetch history");
      }
    };
    fetchAllRequests();
  }, []);

  const filteredData = requests.filter(req => 
    filter === "all" ? true : req.status === filter
  );
  
  const targetRequestId = searchParams.get('requestId');


  useEffect(() => {
    fetchRequests();
    if (targetRequestId) {
      setActiveTab('pending');
    }
  }, [targetRequestId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/approvals/list");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch approvals", err);
      toast.error("Could not load approval requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, decision) => {
    let reason = "";
    if (decision === 'rejected') {
      reason = window.prompt("Enter rejection reason:");
      if (reason === null) return;
      if (reason.trim() === "") return toast.error("Reason is required for rejection");
    }

    try {
      await api.post("/products/approvals/decision", { requestId, decision, reason });
      toast.success(`Request ${decision} successfully`);
      fetchRequests(); 
    } catch (err) {
      console.error("Decision failed", err);
      toast.error("Action failed");
    }
  };

  const filteredRequests = requests.filter(req => 
    req.status.toLowerCase() === activeTab.toLowerCase()
  );

  return (
    <div className="p-6 bg-gray-50 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-[#3674B5]">Approval Management</h2>
        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Total Requests: {requests.length}
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div className="flex space-x-4 mb-6 border-b border-slate-200 flex-shrink-0">
        {['pending', 'approved', 'rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-6 capitalize font-bold text-sm transition-all relative ${
              activeTab === tab ? 'text-[#3674B5]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
            {tab === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#3674B5]" />
            )}
          </button>
        ))}
      </div>

      {/* SCROLLABLE TABLE CONTAINER */}
      <div className="flex-1 min-h-0 bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr className="text-slate-600 uppercase text-[11px] font-black tracking-wider">
                <th className="p-4 border-b border-slate-200">Entity/Field</th>
                <th className="p-4 border-b border-slate-200">Change Details</th>
                <th className="p-4 border-b border-slate-200">Requester</th>
                {activeTab === 'rejected' && <th className="p-4 border-b border-slate-200">Rejection Reason</th>}
                <th className="p-4 text-right border-b border-slate-200">Actions</th>
              </tr>
            </thead>


           <thead>
  <tr className="text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-100 bg-slate-50/50">
    <th className="p-4">Entity & Field</th>
    <th className="p-4">Change Details</th>
    
    {/* Dynamic Column Header */}
    {activeTab === 'pending' ? (
      <th className="p-4">Requester</th>
    ) : (
      <th className="p-4">Timeline & Roles</th>
    )}

    {activeTab === 'rejected' && <th className="p-4">Rejection Reason</th>}
    <th className="p-4 text-right">Status</th>
  </tr>
</thead>

<tbody className="divide-y divide-slate-50">
  {filteredRequests.map(req => (
    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
      
      {/* 1. Entity/Field (Consistent) */}
      <td className="p-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800">Product #{req.entity_id}</span>
          <span className="text-[10px] font-mono text-blue-600 bg-blue-50 w-fit px-1.5 rounded mt-1 uppercase border border-blue-100">
            {req.field_name}
          </span>
        </div>
      </td>

      {/* 2. Change Details (Consistent) */}
      <td className="p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 line-through truncate max-w-[80px]">{req.old_value || 'null'}</span>
          <span className="text-slate-300">→</span>
          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            {req.new_value}
          </span>
        </div>
      </td>

      {/* 3. Requester & Admin (Dynamic Side-by-Side) */}
      <td className="p-4">
        <div className="flex items-center gap-6">
          {/* Always show Requester */}
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 uppercase font-bold">Requested By</span>
            <span className="text-xs text-slate-700 font-medium">{req.requester_name}</span>
              <span className="text-[9px] text-slate-500 font-mono">
        {new Date(req.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
      </span>
          </div>

          {/* Show Admin only if Approved/Rejected */}
          {activeTab !== 'pending' && (
            <>
              <div className="h-6 w-[1px] bg-slate-200" /> {/* Vertical Divider */}
              <div className="flex flex-col">
                <span className="text-[9px] text-blue-500 uppercase font-bold">Verified By</span>
                <span className="text-xs text-slate-700 font-medium">{req.admin_name || 'System'}</span>
                <span className={`text-[9px] text-slate-500 font-mono${activeTab === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                 
        {new Date(req.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
      </span>
              </div>
            </>
          )}
          
        </div>
      </td>

      {/* 4. Rejection Reason (Conditional) */}
      {activeTab === 'rejected' && (
        <td className="p-4">
          <div className="text-[11px] text-rose-600 bg-rose-50/50 p-2 rounded italic border border-rose-100 max-w-[180px] line-clamp-2">
            "{req.rejection_reason || 'No reason provided'}"
          </div>
        </td>
      )}

      {/* 5. Actions/Status (Consistent Position) */}
      <td className="p-4 text-right">
        {activeTab === 'pending' ? (
          <div className="flex justify-end gap-2">
             <button onClick={() => handleAction(req.id, 'approved')} className="p-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shadow-sm transition-transform active:scale-90">
               <HiCheck size={16}/>
             </button>
             <button onClick={() => handleAction(req.id, 'rejected')} className="p-1.5 bg-white text-rose-500 border border-rose-200 rounded-md hover:bg-rose-50 shadow-sm transition-transform active:scale-90">
               <HiX size={16}/>
             </button>
          </div>
        ) : (
          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
            activeTab === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
          }`}>
            {activeTab}
          </span>
        )}
      </td>
    </tr>
  ))}
</tbody>


          </table>
        </div>
      </div>
    </div>
  );
}

export default Approval;