import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { HiOutlineDatabase, HiOutlineCode } from "react-icons/hi";

function ActivityFeed() {
  const { user } = useContext(AuthContext);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

  const fetchActivities = async () => {
    if (!user?.role || !user?.id) return;
    try {
      setLoading(true);
      const res = await api.get("/activity", {
        params: { role: user.role, userId: user.id }
      });
      setActivities(res.data.items || []);
      setNetworkError(false);
    } catch (err) {
      console.error("Activity fetch error:", err);
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const handleRefresh = () => fetchActivities();
    window.addEventListener("activityUpdated", handleRefresh);
    return () => window.removeEventListener("activityUpdated", handleRefresh);
  }, [user]);

const handleRestore = async (log) => {
  try {
    if (!window.confirm(`Restore ${log.field_name} to previous version?`)) return;

    // 1. We fetch the current full form state first
    const currentFormRes = await api.get('/forms/get/product-form');
    const entities = currentFormRes.data.entities;

    // 2. Map through entities and swap the logic for the specific field
    const updatedEntities = entities.map(entity => {
      if (entity.dbKey === log.field_name) {
        return { ...entity, jsSource: log.old_logic }; // Inject the 'old' version
      }
      return entity;
    });

    // 3. Send the bulk save back to the correct route
    await api.post('/forms/save', {
      entities: updatedEntities
    });
    
    alert("Logic restored! A new log entry has been created for this rollback.");
    fetchActivities(); 
  } catch (err) {
    console.error("Restore failed:", err);
    alert("Restore failed. Check console.");
  }
};


  if (loading && activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="w-6 h-6 border-2 border-[#3674B5] border-t-transparent rounded-full animate-spin" />
        <p className="text-[13px] font-medium text-slate-400">Syncing ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 🟢 TABS */}
      <div className="flex items-center justify-center py-1 bg-white border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-md gap-1">
          <button 
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-1 px-4 py-1 font-semibold rounded-md text-[11px] font-black uppercase transition-all ${
              activeTab === 'data' ? 'bg-white text-black font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
             Product Logs
          </button>
          <button 
            onClick={() => setActiveTab('logic')}
            className={`flex items-center gap-2 px-8 py-2 font-semibold rounded-md text-[11px] font-black uppercase transition-all ${
              activeTab === 'logic' ? 'bg-[#3674B5] font-semibold  text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Field Logs
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-2 py-3 overflow-y-auto">
        {networkError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded-lg flex items-center gap-2 animate-pulse mb-2">
            <div className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
            <span className="text-[11px] font-black uppercase tracking-widest text-nowrap">Sync Disconnected</span>
          </div>
        )}

        {activities
  .filter((a) => {
    // 🟢 Clean approach: use the log_type from your new API response
    return activeTab === 'logic' ? a.log_type === 'logic' : a.log_type === 'product';
  })
          .map((a) => {
           
if (activeTab === 'logic') {
  return (
    <div key={`logic-${a.id}`} className="min-h-[110px] flex flex-col rounded-md border border-slate-300 bg-white p-1 shadow-xl">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <HiOutlineCode className="text-slate-500 w-3 h-3" />
          <span className="text-[9px] font-semibold font-black text-slate-500 uppercase  px-2 py-0.5 rounded bg-white">
            {a.field_name || "Logic Update"}
          </span>
        </div>
        <span className="text-[9px] text-slate-500 font-mono">
           {new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      </div>
      
{/* 🟢 Improved Diff Display */}
<div className="font-mono text-[11px] leading-relaxed bg-white p-2 rounded border border-white/5 overflow-x-auto">
  {(() => {
    const oldLines = (a.old_logic || "").split('\n');
    const newLines = (a.new_logic || "").split('\n');
    
    // Find lines that are actually different
    const diff = newLines.map((line, i) => {
      if (line !== oldLines[i]) {
        return { type: 'change', old: oldLines[i], new: line };
      }
      return null;
    }).filter(x => x);

    if (diff.length === 0) return <span className="text-slate-500">// No logic changes detected</span>;

    return diff.map((change, idx) => (
      <div key={idx} className="mb-2 last:mb-0">
        {change.old !== undefined && (
          <div className="text-rose-400/70 flex items-start gap-2 bg-rose-500/5 px-1">
            <span className="w-3 text-center">-</span>
            <code className="whitespace-pre">{change.old}</code>
          </div>
        )}
        <div className="text-emerald-400 flex items-start gap-2 bg-emerald-500/5 px-1">
          <span className="w-3 text-center">+</span>
          <code className="whitespace-pre">{change.new}</code>
        </div>
      </div>
    ));
  })()}
</div>

      <div className=" border-white/5 flex justify-between items-center">
        <span className="text-[9px] text-slate-500  font-semibold">
          Updated by User #{a.created_by}
        </span>
        <button 
          className="text-[7px] font-black font-semibold bg-gray-200 px-1 py-1 rounded-md uppercase text-emerald-400 hover:text-emerald-500 transition-colors"
          onClick={() => handleRestore(a)} 
        >
          Restore
        </button>
      </div>
    </div>
  );
}

            // --- DATA TAB (Your Exact Logic) ---
            const isFailed = a.status === "failed";
            const isDeleted = a.field_name === "status" && a.new_value === "inactive";
            const isCreated = (a.old_value === null || a.old_value === "") && 
                              (a.field_name === "id" || !a.field_name) && 
                              !isDeleted;

            const renderActorBadge = () => {
              if (user?.role !== "admin") return null;
              return (
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 italic">by</span>
                  <span className={`not-italic text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    a.user_role === 'admin' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-[#3674B5]'
                  }`}>
                    {a.user_role === 'admin' ? `Admin (ID: ${a.created_by})` : `User ID: ${a.created_by || 'System'}`}
                  </span>
                </div>
              );
            };

            return (
              <div
                key={a.id}
                className={`group flex flex-col min-h-[100px] rounded-xl border transition-all duration-300 ease-in-out overflow-hidden hover:-translate-y-1 hover:shadow-lg ${
                  isDeleted
                    ? "bg-[#A1E3F9]/5 border-[#A1E3F9]/60 hover:shadow-[#A1E3F9]/20"
                    : isFailed
                      ? "bg-rose-50/30 border-rose-200"
                      : isCreated
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-white border-slate-300 hover:border-slate-200 hover:shadow-slate-200 shadow-sm"
                }`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-3 py-1.5 border-b ${
                  isDeleted ? "border-[#A1E3F9]/20" : isCreated ? "border-emerald-100" : "border-slate-50"
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isDeleted ? "bg-[#A1E3F9]" : isFailed ? "bg-rose-700" : isCreated ? "bg-[#A1E3F9]" : "bg-[#3674B5]"}`} />
                    <span className={`text-[9px]  font-semibold font-black uppercase tracking-wider ${
                      isDeleted ? "text-[#1e4e5e]/80" : isFailed ? "text-rose-700" : isCreated ? "text-[#3a89a0]/100" : "text-slate-500"
                    }`}>
                      {isDeleted ? "Deleted Product" : isFailed ? "Failed to update" : isCreated ? "New Record Added" : `Updated ${a.field_name || 'changes'}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-slate-600 tabular-nums leading-none">
                      {new Date(a.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-[9px] font-medium text-slate-400 uppercase tabular-nums">
                      {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
<div className="px-3 py-1 flex-grow">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
     <h4 className="text-[10px] font-bold text-slate-800 truncate flex items-center gap-1">
  {/* Product ID */}
  <span>Product</span>
  <span className={isDeleted ? "text-[#3a89a0]" : "text-[#3674B5]"}>
    #{a.entity_id || "N/A"}
  </span>

  {/* Separator and User ID */}
  <span className="text-slate-400 font-medium ml-1">by </span>
  <span className="text-[#3a89a0] font-medium ml-1">by User ID</span>
  <span className="text-[#3a89a0] bg-slate-100 px-1 rounded">
    {a.created_by || "System"}
  </span>
</h4>
     
    </div>

   
  </div>

  
  {!isCreated && (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
      <div className="flex-1 px-2 py-0.5 rounded border border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-400 line-through truncate text-center">
        {String(a.old_value || "null")}
      </div>
      <svg className="w-3 h-3 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5-5 5M6 7l5 5-5 5" />
      </svg>
      <div className={`flex-1 px-2 py-0.5 text-[10px] rounded font-semibold truncate text-center ${
        isFailed ? "bg-rose-50 border border-rose-100 text-rose-700 italic" : "bg-[#3674B5]/5  text-[#3674B5]"
      }`}>
        {isFailed ? "Error" : String(a.new_value || "null")}
      </div>
    </div>
  )}
</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default ActivityFeed;