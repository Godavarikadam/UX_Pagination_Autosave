import React, { useContext } from 'react'; 
import { HiOutlineEye, HiOutlineCode, HiOutlinePlusSm } from "react-icons/hi"; 
import { toast } from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext'; 

const ProductLogs = ({ a, isAdmin, navigate }) => {
  const { user: currentUser } = useContext(AuthContext); 

  const isLogicLog = a.log_type === "logic";
  const isPending = a.status === "pending";
  const isRejected = a.status === "rejected";
  const isSuccess = a.status === "success" || a.status === "approved";
  
  
  const isOwnLog = String(a.created_by) === String(currentUser?.id) || 
                   String(a.requested_by) === String(currentUser?.id);

  const getActionStatus = () => {
    if (isPending) return "Pending";
    if (isRejected) return "Rejected";
    if (isSuccess) {
      if (isLogicLog) return "Schema Update"; 
      if (!a.old_value || a.old_value === "null" || a.old_value === "None") return "Added";
      if (a.new_value === "inactive" || a.new_value === "deleted") return "Deleted";
      return (a.updated_at && a.updated_at !== a.created_at) ? "Approved" : "Updated";
    }
    return "Log";
  };

  const actionStatus = getActionStatus();

  const displayName = a.field_name 
    ? a.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : isLogicLog ? "Validation Logic" : "Product";

  const statusColors = {
    Pending: "text-amber-600 bg-amber-500",
    Rejected: "text-rose-600 bg-rose-600",
    Approved: "text-emerald-600 bg-emerald-500",
    Updated: "text-blue-600 bg-blue-500",
    Added: "text-cyan-600 bg-cyan-500",
    Deleted: "text-slate-600 bg-slate-600",
    "Schema Update": "text-purple-600 bg-purple-500"
  };

  const formatVal = (val) => {
    if (val === null || val === undefined) return "None";
    if (typeof val === 'object') return "{ JSON }";
    return String(val);
  };

  return (
    <div key={a.id} className={`group flex flex-col min-h-[100px] rounded-md border transition-all duration-300 mb-2 overflow-hidden hover:shadow-md ${
      actionStatus === "Rejected" ? "bg-rose-50/40 border-rose-200" :
      actionStatus === "Approved" ? "bg-emerald-50/40 border-emerald-200" :
      isLogicLog ? "bg-purple-50/20 border-purple-200" : "bg-white border-slate-200 shadow-sm"
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-white/50">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${actionStatus === "Pending" ? "animate-pulse" : ""} ${statusColors[actionStatus]?.split(' ')[1] || 'bg-slate-400'}`} />
          <span className={`text-[10px] font-black font-semibold uppercase tracking-wider ${statusColors[actionStatus]?.split(' ')[0] || 'text-slate-600'}`}>
             {isLogicLog ? `LOGIC: ${displayName}` : ( (actionStatus === "Added" || actionStatus === "Deleted") ? actionStatus : `${actionStatus} ${displayName}` )}
          </span>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">
          {new Date(a.updated_at || a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      </div>

      <div className="px-3 py-2">
        <div className="flex justify-between items-start">
          <h4 className="text-[10px] font-semibold text-slate-800">
            {isLogicLog ? (
               <span className="flex items-center gap-1 text-purple-700">
                 <HiOutlineCode size={12} /> 
               </span>
            ) : (
              <>Product <span className="text-[#3674B5]">#{a.entity_id}</span></>
            )}
            
           
            {(!isOwnLog) && (
              <span className="text-slate-600 font-normal ml-1 ">
                by User {a.created_by || a.requested_by}
              </span>
            )}
          </h4>
       
          {isAdmin && isPending && (
            <button 
              onClick={() => {
                if (!a.request_id && !isLogicLog) return toast.error("Log entry is missing its reference ID");
                navigate(isLogicLog ? `/products/form` : `/approvals/${a.entity_id}/${a.request_id}`);
              }}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-200 text-black rounded text-[8px] font-semibold uppercase hover:bg-amber-400"
            >
              <HiOutlineEye size={10} /> Review
            </button>
          )}
        </div>
      <div className="mt-2">
 
 <div className="flex items-center justify-start gap-3 bg-white/50 px-1.5 py-1 rounded border border-slate-50">
 
  <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
    {isLogicLog ? "Config" : displayName}:
  </span>

  {actionStatus === "Added" ? (
    <div className="flex items-center overflow-hidden">
      <span className="text-[10px] font-bold text-cyan-700 truncate">
        {isOwnLog ? "New Product Added" : `Added by User ${a.created_by}`}
      </span>
      
    </div>
  ) : (
    <div className="flex items-center gap-1.5 overflow-hidden">
      
      <div className="text-[11px] font-semibold text-slate-400 line-through truncate">
        {formatVal(a.old_value)}
      </div>
      
      
      <span className="text-slate-400 text-[12px] leading-none">→</span>
      
    
      <div className={`text-[11px] font-semibold truncate ${
          actionStatus === "Rejected" ? "text-rose-700" : 
          actionStatus === "Approved" ? "text-emerald-700" : "text-[#3674B5]"
      }`}>
        {formatVal(a.new_value)}
      </div>
    </div>
  )}
</div>

</div>
        {/* ADMIN DECISION FOOTER */}
        {((isSuccess || isRejected) && a.admin_id) || (isRejected && a.rejection_reason) ? (
          <div className={`mt-2 p-1.5 rounded border flex flex-col gap-1 ${
            isRejected ? 'bg-rose-100/50 border-rose-100' : 'bg-emerald-50/30 border-emerald-100'
          }`}>
            {a.admin_id && (
              <div className="flex items-center gap-1">
                <span className={`text-[8px] font-bold uppercase px-1 rounded ${
                  isRejected ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {isRejected ? 'Rejected' : 'Verified'} by Admin Id {a.admin_id}
                </span>
              </div>
            )}
            {isRejected && a.rejection_reason && (
              <p className="text-[9px] italic line-clamp-2 text-rose-700">
                <span className="font-bold uppercase not-italic mr-1 text-[8px]">Reason:</span> 
                {a.rejection_reason}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProductLogs;