import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import {HiOutlineCode } from "react-icons/hi";
import toast from 'react-hot-toast';
import FieldLogs from './FieldLogs'; 
import ProductLogs from './ProductLogs';

import { useNavigate } from 'react-router-dom'; 
import { HiOutlineEye } from "react-icons/hi"; 

function ActivityFeed() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [activeTab, setActiveTab] = useState('data');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!isAdmin && activeTab === 'logic') {
      setActiveTab('data');
    }
  }, [isAdmin, activeTab]);

  const fetchActivities = async () => {
    if (!user?.role || !user?.id) return;
    try {
      setLoading(true);
      const res = await api.get("/activity", {
        params: { role: user.role, userId: user.id,type: activeTab === 'logic' ? 'logic' : 'product' }
      });
      const sortedData = (res.data.items || []).sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA;
    });
      setActivities(sortedData);
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
  }, [user,activeTab]);

  const handleRestore = (log) => {
    toast((t) => (
      <div className="min-w-[200px]">
        <p className="text-[12px] font-medium text-slate-700 leading-tight">
          Restore <span className="text-[#3674B5] font-semibold">{log.field_name}</span>?
        </p>
        <div className="mt-1 flex justify-end gap-1">
          <button className="px-2 py-1.5 text-[11px] bg-gray-200 rounded-md  text-slate-600" onClick={() => toast.dismiss(t.id)}>Cancel</button>
          <button
            className="rounded-md  px-2 py-1.5 bg-gray-200 text-[11px] text-black"
            onClick={async () => {
              toast.dismiss(t.id);
              const loadingToast = toast.loading("Syncing...");
              try {
                const res = await api.get("/forms/get/product-form");
                const updated = res.data.entities.map(e => e.dbKey === log.field_name ? { ...e, jsSource: log.old_logic } : e);
                await api.post("/forms/save", { entities: updated });
                toast.success("Restored!", { id: loadingToast });
                fetchActivities();
              } catch (err) {
                toast.error("Failed", { id: loadingToast });
              }
            }}
          >Restore</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Switcher */}
      <div className="flex items-center justify-center py-1 bg-white border-b border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-md gap-1">
          <button 
            onClick={() => setActiveTab('data')}
            className={`px-4 py-1 rounded-md text-[11px] font-black uppercase font-semibold transition-all ${
              activeTab === 'data' ? 'bg-[#3674B5] text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Product Logs
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('logic')}
              className={`px-4 py-1 rounded-md font-semibold text-[11px] font-black uppercase transition-all ${
                activeTab === 'logic' ? 'bg-[#3674B5] text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              Field Logs
            </button>
          )}
        </div>
      </div>

    {/* Feed Content */}
<div className="flex flex-col gap-2 px-2 py-3 overflow-y-auto">
  {networkError && (
    <div className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded-lg flex items-center gap-2 mb-2">
      <span className="text-[11px] font-black uppercase tracking-wider">Sync Disconnected</span>
    </div>
  )}

  {loading && activities.length === 0 ? (
    [1, 2, 3].map((i) => (
      <div key={i} className="min-h-[100px] rounded-md border border-slate-200 bg-slate-50 animate-pulse mb-2" />
    ))
  ) : (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {(() => {
        const filtered = activities.filter((a) => 
          activeTab === 'logic' ? a.log_type === 'logic' : a.log_type === 'product'
        );

        if (filtered.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-slate-50 p-4 rounded-full mb-3">
                {activeTab === 'logic' ? (
                  <HiOutlineCode className="text-slate-300" size={32} />
                ) : (
                  <HiOutlineEye className="text-slate-300" size={32} />
                )}
              </div>
              <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">
                No {activeTab} Activity
              </h3>
              <p className="text-[12px] text-gray-500 mt-1 max-w-[180px] leading-relaxed">
                {activeTab === 'logic' 
                  ? "Changes to field logic and validation will be tracked here." 
                  : "Start updating products to see your activity timeline."}
              </p>
            </div>
          );
        }

        return filtered.map((a) => (
          activeTab === 'logic' 
            ? <FieldLogs key={a.id} a={a} handleRestore={handleRestore} />
            : <ProductLogs key={a.id} a={a} isAdmin={isAdmin} navigate={navigate} />
        ));
      })()}
    </div>
  )}
</div>


    </div>
  );
}



export default ActivityFeed;