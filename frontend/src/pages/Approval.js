import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { toast } from "react-hot-toast";
import { HiCheck, HiOutlineEye, HiX, HiSearch, HiFilter, HiOutlineCube } from "react-icons/hi";
import PaginationBar from "../components/ledger/PaginationBar";

function Approval() {
  const { productId, requestId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawuser = sessionStorage.getItem('user');
  const userdata = rawuser ? JSON.parse(rawuser) : {};
  const isAdmin = userdata.role === 'admin';
  const filterField = searchParams.get("field") || "all";

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

  const fetchRequests = async () => {
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
    // 1. If Approved, proceed directly
    if (decision === 'approved') {
      return executeDecision(requestId, 'approved', "");
    }

    // 2. If Rejected, show the Interactive Toast
    toast((t) => (
      <div className="flex flex-col gap-3 min-w-[280px]">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-800">Rejection Reason</span>
          <span className="text-[11px] text-slate-500">Please explain why this change was declined.</span>
        </div>

        <textarea
          id={`reason-input-${requestId}`}
          rows="3"
          className="w-full p-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-rose-500 outline-none"
          placeholder="Type reason here..."
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 rounded"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const reasonVal = document.getElementById(`reason-input-${requestId}`).value;
              if (!reasonVal.trim()) {
                toast.error("Reason is required", { id: 'validation' });
                return;
              }
              toast.dismiss(t.id);
              executeDecision(requestId, 'rejected', reasonVal);
            }}
            className="px-3 py-1 text-[11px] font-bold bg-rose-600 text-white rounded hover:bg-rose-700 shadow-sm"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    ), { duration: Infinity, position: 'top-center' });
  };

  // 3. Helper function to handle the actual API call
  const executeDecision = async (requestId, decision, reason) => {
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

    // NEW: Filter by the specific field name (CREATE_NEW_PRODUCT)
    const matchesField = filterField === "all" || req.field_name === filterField;

    const matchesSearch =
      req.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.entity_id?.toString().includes(searchTerm);

    return matchesStatus && matchesField && matchesSearch;
  });
  return (
    <div className="h-full flex flex-col bg-white shadow-xl shadow-slate-100/40 rounded overflow-hidden">

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 pb-0 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-[12px] ml-4 mb-1 font-semibold text-gray-500">
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
              className="pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 uppercase  outline-none focus:ring-0.5 focus:ring-gray-200 appearance-none cursor-pointer shadow-sm"
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

                <th className="w-[100px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">Product ID</th>

                <th className="w-[140px] px-6 py-3 text-[10px] font-black text-gray-900 uppercase border border-slate-300">Target Field</th>


                <th className="px-6 py-3 text-[10px] font-black text-gray-900  uppercase border border-slate-300">Value Logs</th>

                {isAdmin && (
                  <th className="w-[200px] px-4 py-3 text-[10px] font-black text-gray-900 uppercase border border-slate-300">
                    {filterStatus === 'rejected' ? 'Rejection Reason' : 'Requested By'}
                  </th>
                )}

                <th className={`${(filterStatus === 'approved' || filterStatus === 'rejected') ? 'w-[200px]' : 'w-[140px]'} px-4 py-3 text-[10px] font-black text-gray-900 uppercase border border-slate-300 text-center`}>
                  {(filterStatus === 'approved' ? 'Verified By' : filterStatus === 'rejected' ? 'Rejected By' : 'Action')}
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



                    <td className="px-4 py-3 border border-slate-200 text-center text-slate-500 font-medium">
                      {req.entity_id === 0 || !req.entity_id ? (
                        <span className="text-[16px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold italic">
                          -
                        </span>
                      ) : (
                        <span className="text-[12px] font-semibold text-slate-600">
                          #{req.entity_id}
                        </span>
                      )}
                    </td>


                    <td className="px-6 py-3 border border-slate-200 ">
                      <span className="text-[12px] font-black text-[#3674B5] font-semibold px-2 py-1 rounded ">
                        {req.field_name?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3 border border-slate-200">
                      {req.field_name === 'CREATE_NEW_PRODUCT' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded  tracking-tighter">
                            New
                          </span>
                          <span className="text-emerald-700 font-bold text-[12px] truncate max-w-[180px]">
                            {(() => {
                              try {
                                // Only show the product name, not the whole JSON object
                                const data = JSON.parse(req.new_value);
                                return data.name || "New Product Submission";
                              } catch (e) {
                                return "New Product Data";
                              }
                            })()}
                          </span>
                        </div>
                      ) : (
                        /* Existing logic for standard field updates (e.g., Price, Qty) */
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400 line-through truncate max-w-[100px]">{req.old_value}</span>
                          <span className="text-slate-400">→</span>
                          <span className="text-emerald-600 font-bold truncate max-w-[100px]">{req.new_value}</span>
                        </div>
                      )}
                    </td>

                    {isAdmin && (
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
                            <span className="text-[12px] uppercase text-gray-600 font-semibold">
                              Id: {req.requester_id || "unknown"}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(req.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        )}
                      </td>
                    )}

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
                              <span className="text-[12px] text-gray-600  font-semibold uppercase truncate">
                                Id: {req.admin_id || "System"}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {new Date(req.updated_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>

                            </div>
                          );
                        }


                        /* Case 3: Pending Requests */
                        return (
                          <div className="flex justify-center items-center gap-1">
                            {/* 1. ADMIN-ONLY ACTIONS: Approve/Reject */}
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleAction(req.id, 'approved')}
                                  className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 shadow-sm active:scale-95 transition-transform"
                                  title="Approve"
                                >
                                  <HiCheck size={16} />
                                </button>
                                <button
                                  onClick={() => handleAction(req.id, 'rejected')}
                                  className="p-1.5 bg-white text-rose-500 border border-rose-200 rounded hover:bg-rose-50 shadow-sm active:scale-95 transition-transform"
                                  title="Reject"
                                >
                                  <HiX size={16} />
                                </button>
                              </>
                            )}

                            {!isAdmin && (
                              <span className="text-[12px] font-semibold text-amber-600 px-2 py-1 rounded  ">
                                Pending
                              </span>
                            )}

                            {req.field_name === 'CREATE_NEW_PRODUCT' && (
                              <button
                                onClick={() => navigate(`/approvals/new/${req.id}${location.search}`)}
                                className="p-1.5 bg-[#3674B5] text-white rounded hover:bg-blue-700 shadow-sm active:scale-95 transition-transform flex items-center justify-center"
                                title="View Product Details"
                              >
                                <HiOutlineEye size={16} />
                              </button>
                            )}
                          </div>
                        );

                      })()}
                    </td>

                  </tr>
                ))
              )}
            </tbody>


          </table>

          {/* 🟢 NEW PRODUCT REVIEW MODAL */}
          {location.pathname.includes('/approvals/new/') && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">

                {/* Header matching your SS */}
                <div className="flex justify-between items-center p-4 border-b bg-slate-50/50">
                  <div>
                    <h3 className="text-[12px] font-semibold text-[#3674B5] uppercase tracking-tight">Review New Product</h3>
                    <p className="text-[10px] text-slate-500 font-bold">REQ ID: #{params.requestId}</p>
                  </div>
                  <button onClick={() => navigate('/approvals')} className="text-slate-400 hover:text-rose-500 transition-colors">
                    <HiX size={20} />
                  </button>
                </div>

                {/* Body: Matches your 'prody' screenshot style */}
                <div className="p-6 space-y-5">
                  {(() => {
                    // Find the specific request from your 'displayedRequests' or 'allRequests' state
                    const currentReq = displayedRequests.find(r => String(r.id) === String(params.requestId));
                    if (!currentReq) return <div className="text-center p-4 text-xs italic">Loading request data...</div>;

                    try {
                      const data = JSON.parse(currentReq.new_value);
                      return (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-800 uppercase flex items-center gap-1">
                              Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded text-[13px] text-slate-700 font-semibold">
                              {data.name}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-800 uppercase flex items-center gap-1">
                                Quantity <span className="text-rose-500">*</span>
                              </label>
                              <div className="mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded text-[13px] text-slate-700 font-semibold">
                                {data.quantity}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-800 uppercase flex items-center gap-1">
                                Unit Price <span className="text-rose-500">*</span>
                              </label>
                              <div className="mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded text-[13px] text-slate-700 font-semibold">
                                Rs. {data.unit_price}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-800 uppercase">Description</label>
                            <div className="mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 italic min-h-[50px]">
                              {data.description || "No description provided"}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-slate-800 uppercase">Category <span className="text-rose-500">*</span></label>
                            <div className="mt-1.5 flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded">
                              {['hardware', 'software', 'kitchenstuff', 'homedesign'].map(cat => (
                                <div key={cat} className="flex items-center gap-2">
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${data.category === cat ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                    {data.category === cat && <HiCheck size={10} className="text-white" />}
                                  </div>
                                  <span className={`text-[11px] font-semibold uppercase ${data.category === cat ? 'text-slate-900' : 'text-slate-400'}`}>{cat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return <div className="p-4 text-center text-rose-500">Error: Invalid Data Format</div>;
                    }
                  })()}
                </div>


                {/* Footer: Action Buttons */}
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                  {isAdmin?(
                    <>
                  <button
                    onClick={() => { handleAction(params.requestId, 'rejected'); navigate('/approvals'); }}
                    className="px-4 py-2 text-rose-600 font-semibold text-[11px] uppercase border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { handleAction(params.requestId, 'approved'); navigate('/approvals'); }}
                    className="px-6 py-2 bg-[#3674B5] text-white font-semibold text-[11px] uppercase rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    Approve & Create
                  </button>
                  </>

                  ):(
                    <button
      onClick={() => navigate('/approvals')}
      className="px-8 py-2 bg-[#3674B5] text-white font-semibold text-[11px] uppercase rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all"
    >
      Close Preview
    </button>
                  )}

                </div>
               

              </div>
            </div>
          )}
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