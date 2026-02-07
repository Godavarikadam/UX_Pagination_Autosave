import React from 'react';
import { HiOutlineEye } from "react-icons/hi";
import {toast} from 'react-hot-toast';

const ProductLogs = ({ a, isAdmin, navigate }) => {
  const isPending = a.status === "pending";
  const isRejected = a.status === "rejected";
  const isSuccess = a.status === "success" || a.status === "approved";
  
  // 🟢 FRONTEND LOGIC: Determine the core action
  const getActionStatus = () => {
    if (isPending) return "Pending";
    if (isRejected) return "Rejected";
    
    if (isSuccess) {
      // 1. Created: No old value exists
      if (!a.old_value || a.old_value === "null" || a.old_value === "None") {
        return "Added";
      }

      // 2. Deleted: New value is a terminal state
      if (a.new_value === "inactive" || a.new_value === "deleted") {
        return "Deleted";
      }

      // 3. Approved: Modified after creation (moved from pending)
      const hasBeenModified = a.updated_at && a.updated_at !== a.created_at;
      if (hasBeenModified) {
        return "Approved";
      }

      // 4. Updated: Fresh direct edits
      return "Updated";
    }
    return "Log";
  };

  const actionStatus = getActionStatus();

  // 🟢 TEXT LOGIC: Remove displayName for Created/Deleted
  const displayName = a.field_name 
    ? a.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : "Product";

  const headerText = (actionStatus === "Added" || actionStatus === "Deleted")
    ? actionStatus
    : `${actionStatus} ${displayName}`;

  const statusColors = {
    Pending: "text-amber-600 bg-amber-500",
    Rejected: "text-rose-600 bg-rose-600",
    Approved: "text-emerald-600 bg-emerald-500",
    Updated: "text-blue-600 bg-blue-500",
    Added: "text-cyan-600 bg-cyan-500",
    Deleted: "text-slate-600 bg-slate-600"
  };

  return (
    <div key={a.id} className={`group flex flex-col min-h-[100px] rounded-md border transition-all duration-300 mb-2 overflow-hidden hover:shadow-md ${
      actionStatus === "Rejected" ? "bg-rose-50/40 border-rose-200" :
      actionStatus === "Approved" ? "bg-emerald-50/40 border-emerald-200" :
      actionStatus === "Updated" ? "bg-blue-50/40 border-blue-200" :
      actionStatus === "Added" ? "bg-cyan-50/40 border-cyan-200" :
      actionStatus === "Pending" ? "bg-amber-50/30 border-amber-200" : "bg-white border-slate-200 shadow-sm"
    }`}>
      {/* Header with Custom Label Logic */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-white/50">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${actionStatus === "Pending" ? "animate-pulse" : ""} ${statusColors[actionStatus].split(' ')[1]}`} />
          <span className={`text-[10px] font-black font-semibold uppercase tracking-wider ${statusColors[actionStatus].split(' ')[0]}`}>
            {headerText}
          </span>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">
          {new Date(a.updated_at || a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      </div>

      <div className="px-3 py-2">
        <div className="flex justify-between items-start">
          <h4 className="text-[10px] font-bold text-slate-800">
            Product <span className="text-[#3674B5]">#{a.entity_id}</span>
            <span className="text-slate-400 font-normal ml-1 italic">by User {a.created_by}</span>
          </h4>
       
{isAdmin && isPending && (
  <button 
    onClick={() =>{
      if (!a.request_id) {
      return toast.error("Log entry is missing its reference ID");
    
    }
       navigate(`/approvals/${a.entity_id}/${a.request_id}`)} }
    className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded text-[8px] font-bold uppercase transition-all shadow-sm active:scale-95 hover:bg-amber-600"
  >
    <HiOutlineEye size={10} /> Review
  </button>
)}
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-semibold text-gray-500 ">{displayName} Change:</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 p-1 rounded border border-slate-50">
            <div className="flex-1 text-[10px] font-semibold text-slate-400 line-through truncate text-center">{String(a.old_value || "null")}</div>
            <span className="text-slate-300 text-[10px]">→</span>
            <div className={`flex-1 text-[10px] rounded font-semibold truncate text-center ${
                actionStatus === "Rejected" ? "text-rose-700" : 
                actionStatus === "Approved" ? "text-emerald-700" : "text-[#3674B5]"
            }`}>
              {String(a.new_value || "null")}
            </div>
          </div>
        </div>

        {isRejected && (a.rejection_reason || a.notes) && (
          <div className="mt-2 p-1.5 rounded bg-rose-100/50 border border-rose-100">
            <p className="text-[9px] text-rose-700 italic line-clamp-2 break-words whitespace-normal leading-relaxed">
              <span className="font-bold uppercase not-italic mr-1 text-[8px]">Reason:</span> 
              {a.rejection_reason || a.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductLogs;