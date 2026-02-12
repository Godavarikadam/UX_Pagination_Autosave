import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useOutletContext, useNavigate, useParams, useLocation } from "react-router-dom";
import LedgerRow from "./LedgerRow";
import PaginationBar from "./PaginationBar";
import ProductDrawer from "../drawer/ProductDrawer";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { HiOutlineSortAscending, HiOutlineSortDescending } from "react-icons/hi";

function LedgerTable() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { productId: urlProductId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchTerm } = useOutletContext();

  const [config, setConfig] = useState({ defaultLimit: null, defaultSort: "id", isLoaded: false });

  // Pagination & Sorting State
  const page = Number(searchParams.get("page")) || 1;
  const urlLimit = searchParams.get("limit");
  const limit = urlLimit ? Number(urlLimit) : (config.defaultLimit || 5);
  const sortBy = searchParams.get("sortBy") || "id";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // FIX: Initialize as true so "No items found" doesn't flash on mount
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  // --- HANDLERS ---
  const pendingAdditions = pendingRequests.filter(
    (r) => r.field_name === "CREATE_NEW_PRODUCT" && r.status === "pending"
  );

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get('/products/approvals/list');

        const items = res.data.items || (Array.isArray(res.data) ? res.data : []);

        setPendingRequests(items);
      } catch (err) {
        console.error("Failed to fetch pending requests", err);
      }
    };

    fetchPending();
    window.addEventListener("activityUpdated", fetchPending);
    return () => window.removeEventListener("activityUpdated", fetchPending);
  }, [refreshCounter]);


  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = products.map((p) => p.id);
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    } else {
      const pageIds = products.map((p) => p.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-gray-800">
            Delete {selectedIds.length} items?
          </span>
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">
          Are you sure you want to delete these products? They will be moved to inactive status.
        </p>
        <div className="flex justify-end gap-2 mt-1">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-2 py-1 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await executeBulkDelete();
            }}
            className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded-md shadow-sm hover:bg-rose-600 transition-all"
          >
            CONFIRM DELETE
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
      style: { border: '1px solid #FDA4AF', padding: '12px', minWidth: '280px' },
    });
  };

  const executeBulkDelete = async () => {
    const loadingToast = toast.loading(`Processing ${selectedIds.length} deletions...`);
    try {
      setLoading(true);
      await api.post("/products/bulk-delete", { ids: selectedIds });
      toast.success(`Successfully deleted ${selectedIds.length} items`, { id: loadingToast });
      setSelectedIds([]);
      setRefreshCounter(prev => prev + 1);
      window.dispatchEvent(new Event("activityUpdated"));
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete items", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddProduct = () => navigate("/products/add" + search);
  const handleRowClick = (product) => navigate(`/products/edit/${product.id}${search}`);
  const handleCloseDrawer = () => navigate("/products" + search);

  const handleRowUpdate = (updatedProduct, isNew = false) => {
    if (isNew) {
      const predictedTotal = total + 1;
      const targetPage = Math.max(Math.ceil(predictedTotal / limit), 1);
      setRefreshCounter(prev => prev + 1);
      setTimeout(() => {
        navigate(`/products?page=${targetPage}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      }, 100);
    } else {
      setRefreshCounter(prev => prev + 1);
    }
    window.dispatchEvent(new Event("activityUpdated"));
  };

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        const settingsMap = {};
        res.data.forEach(item => settingsMap[item.key] = item.value);
        const dbLimit = parseInt(settingsMap.DEFAULT_PAGE_SIZE);
        setConfig({
          defaultLimit: !isNaN(dbLimit) ? dbLimit : 15,
          defaultSort: settingsMap.DEFAULT_SORT_COL || "id",
          isLoaded: true
        });
      } catch (err) {
        setConfig({ defaultLimit: 5, defaultSort: "id", isLoaded: true });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {

    if (!urlLimit && !config.isLoaded) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/products?page=${page}&limit=${limit}&search=${searchTerm || ""}&sort=${sortBy}&sortOrder=${sortOrder}`
        );
        if (res.data) {
          setProducts(res.data.items ?? []);
          setTotal(res.data.total ?? 0);
        }
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Immediate fetch if no search, otherwise debounce
    const delayDebounce = setTimeout(fetchProducts, searchTerm ? 300 : 0);
    return () => clearTimeout(delayDebounce);

    // Adding config.isLoaded here ensures this re-runs as soon as the settings arrive
  }, [page, limit, searchTerm, sortBy, sortOrder, config.isLoaded, refreshCounter]);
  const handleDeleteSuccess = (deletedId) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
    const remainingOnPage = products.length - 1;
    if (remainingOnPage === 0 && page > 1) {
      updateUrl({ page: page - 1 });
    } else {
      setRefreshCounter(prev => prev + 1);
    }
    window.dispatchEvent(new Event("activityUpdated"));
  };

  // --- DRAWER SYNC LOGIC ---
  useEffect(() => {
    const isAddMode = pathname.includes("/products/add");
    const isEditMode = pathname.includes("/products/edit");

    if (isAddMode) {
      setSelectedProduct({ isNew: true, name: "", quantity: 1, unit_price: 1.00 });
      setDrawerOpen(true);
    } else if (isEditMode && urlProductId) {
      const found = products.find((p) => String(p.id) === String(urlProductId));
      if (found) {
        setSelectedProduct(found);
        setDrawerOpen(true);
      }
    } else {
      setDrawerOpen(false);
      setSelectedProduct(null);
    }
  }, [pathname, urlProductId, products]);

  return (
    <div className="flex flex-col h-full bg-white relative font-sans">
      <div className="px-4 py-2.5  bg-white z-20">
        <div className="flex flex-wrap items-center gap-4 px-4">
          {/* Change near line 155 */}
          <div className="text-[12px] font-semibold text-gray-500 flex items-center gap-3">
            <div>
              Total Items: <span className="text-[#3674B5] font-black">{total}</span>
            </div>

            {pendingAdditions.length > 0 && (
              <button
                onClick={() => navigate('/approvals?status=pending&field=CREATE_NEW_PRODUCT')}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full hover:bg-amber-100 transition-all group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">
                  Pending  {pendingAdditions.length} New Products
                </span>

              </button>
            )}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center h-7 rounded border border-slate-300 bg-slate-50 overflow-hidden group">
              <div className="px-2.5 flex items-center h-full bg-slate-100 border-r border-slate-200">
                <span className="text-[9px] font-black text-slate-600 uppercase">Sort by</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => updateUrl({ sortBy: e.target.value })}
                className="h-full pl-2 pr-1 text-[10px] font-bold text-slate-800 bg-white outline-none"
              >
                <option value="id">Product ID</option>
                <option value="name">Product Name</option>
                <option value="quantity">Quantity</option>
                <option value="unit_price">Unit Price</option>
              </select>
              <button
                onClick={() => updateUrl({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="h-full px-2 bg-white text-slate-400 hover:text-[#3674B5] border-l border-slate-100"
              >
                {sortOrder === 'asc' ? <HiOutlineSortAscending size={14} /> : <HiOutlineSortDescending size={14} />}
              </button>
            </div>

            {(sortBy !== 'id' || sortOrder !== 'asc') && (
              <button
                onClick={() => {
                  const newParams = new URLSearchParams();
                  if (urlLimit) newParams.set("limit", urlLimit);
                  newParams.set("page", "1");
                  newParams.set("sortBy", "id");
                  newParams.set("sortOrder", "asc");
                  setSearchParams(newParams);
                }}
                className="flex items-center gap-2 border border-red-100 rounded-lg px-3 py-1 bg-white hover:bg-red-50 transition-colors"
              >
                <span className="text-[10px] font-bold text-red-500">Clear All</span>
              </button>
            )}


            <button
              onClick={handleAddProduct}
              className="px-3 py-2 rounded-lg bg-[#3674B5] text-white text-[11px] font-bold shadow-sm hover:bg-[#2d6298] transition-all font-semibold"
            >
              + Add Product
            </button>


          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 flex flex-col relative">
        <div className="flex-1 overflow-y-auto   custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-100">
                {isAdmin && (
                  <th className="w-[50px] px-4 py-3 text-center border border-slate-300">
                    <input
                      type="checkbox"
                      className="cursor-pointer h-3 w-3 accent-[#3674B5]"
                      onChange={handleSelectAll}
                      checked={products.length > 0 && products.every(p => selectedIds.includes(p.id))}
                    />
                  </th>
                )}
                <th className="w-[90px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">PID</th>
                <th className="px-7 py-3 text-left text-[10px] font-black text-gray-900 uppercase border border-slate-300">Product Name</th>
                <th className="w-[100px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">Quantity</th>
                <th className="w-[120px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">Unit Price</th>
                <th className="w-[80px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">Edit</th>
                {isAdmin && <th className="w-[80px] px-4 py-3 text-center text-[10px] font-black text-gray-900 uppercase border border-slate-300">Delete</th>}
              </tr>
            </thead>
            <tbody>


              {loading && products.length === 0 ? (
                // Render 5 pulsing "Ghost Rows" to match your table structure
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-50">
                    {isAdmin && (
                      <td className="px-4 py-4 text-center">
                        <div className="h-3 w-3 bg-slate-100 rounded mx-auto" />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="h-3 w-12 bg-slate-100 rounded mx-auto" />
                    </td>
                    <td className="px-7 py-4">
                      <div className="h-3 w-3/4 bg-slate-100 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-16 bg-slate-100 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 w-20 bg-slate-100 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 w-4 bg-slate-100 rounded mx-auto" />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-4 text-center">
                        <div className="h-4 w-4 bg-slate-100 rounded mx-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : products.length > 0 ? (
                products.map((p) => (
                  <LedgerRow
                    key={p.id}
                    product={p}
                    isSelected={selectedIds.includes(p.id)}
                    // 🟢 Change 'onSelect' to 'onCheckboxToggle'
                    onCheckboxToggle={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                    onRowClick={() => handleRowClick(p)}
                    onDeleteSuccess={handleDeleteSuccess}
                    isAdmin={isAdmin}
                    overallStatus={p.current_request_status}
                    pendingChanges={pendingRequests.filter(r => String(r.entity_id) === String(p.id))}
                  />
                ))
              ) : pendingAdditions.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="py-24 text-center text-slate-400 font-medium italic">
                    No items found matching your criteria.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-3 ml-2 py-3 border-t border-slate-200 bg-white ">
        <PaginationBar
          page={page}
          limit={limit}
          totalPages={Math.max(Math.ceil(total / limit), 1)}
          setPage={(p) => updateUrl({ page: p })}
          setLimit={(l) => updateUrl({ page: 1, limit: l })}
        />
      </div>

      {drawerOpen && (
        <ProductDrawer
          product={selectedProduct}
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
          onUpdate={handleRowUpdate}
        />
      )}

      {selectedIds.length > 0 && (
        <div className="fixed top-4 right-6 z-[100] min-w-[260px] animate-in slide-in-from-right-8 fade-in duration-500 ease-out">
          <div className="bg-white border border-slate-200 px-1 py-1 rounded-lg shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-2 pl-2">
              <div className="h-5 w-5 bg-[#3674B5] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {selectedIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight leading-none">Items</span>
                <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">Selected</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pr-1">
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-md transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black rounded-md transition-all shadow-sm active:scale-95"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LedgerTable;