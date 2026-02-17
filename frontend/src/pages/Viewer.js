import React, { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import {
  HiOutlineFilter,
  HiOutlineChevronRight 
} from "react-icons/hi";

import ProductSnapshot from "../components/viewerSide/ProductSnapshot";
import ProductCard from "../components/viewerSide/ProductCard";
import OrderHistory from "../components/viewerSide/OrderHistory";

const Viewer = ({ searchTerm = "" }) => {
  const getQueryParam = (key, fallback = "All") => {
    return new URLSearchParams(window.location.search).get(key) || fallback;
  };

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState(() => getQueryParam("cat"));
  const [priceFilter, setPriceFilter] = useState(() => getQueryParam("price"));
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("marketplace");
  const [sortOrder, setSortOrder] = useState("relevance");
  // NEW STATE: Controls if we show the horizontal "Featured" row or the full grid
  const [showAll, setShowAll] = useState(false);

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("details");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedCategory !== "All") params.set("cat", selectedCategory);
    else params.delete("cat");
    if (priceFilter !== "All") params.set("price", priceFilter);
    else params.delete("price");

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newUrl);
    setPage(1);

    if (selectedCategory !== "All" || priceFilter !== "All") {
      setShowAll(true);
    }
  }, [selectedCategory, priceFilter]);

  useEffect(() => {

    const urlParams = new URLSearchParams(window.location.search);
    const pIdFromUrl = urlParams.get('productId');

    if (pIdFromUrl && products.length > 0) {
      const foundProduct = products.find(p => p.id.toString() === pIdFromUrl);

      if (foundProduct) {
        setSelectedProduct(foundProduct);
        setDrawerMode("details");
        setIsSnapshotOpen(true);
        setShowAll(true); // Ensure grid is visible to see the selection
      }
    }
  }, [products]); // Re-runs once products are fetched from the API

  const fetchViewerData = useCallback(async (isLoadMore = false) => {
    try {
      setLoading(!isLoadMore);
      const currentPage = isLoadMore ? page + 1 : 1;

      const params = new URLSearchParams({
        category: selectedCategory,
        priceRange: priceFilter,
        search: searchTerm,
        page: currentPage,
        sort: sortOrder
      });

      console.log("--- API Request Started ---");
      console.log("Request URL Params:", params.toString());

      const response = await api.get(`/products/marketplace?${params.toString()}`);

      if (response.data) {
        const itemsReceived = response.data.items || [];
        const totalCount = response.data.total || 0;

        console.log("API Response Success:");
        console.log("- Total items available in DB:", totalCount);
        console.log("- Items received in this batch:", itemsReceived.length);
        console.log("- Raw items array:", itemsReceived);

        if (isLoadMore) {
          setProducts(prev => [...prev, ...itemsReceived]);
          setPage(currentPage);
        } else {
          setProducts(itemsReceived);
          setTotalItems(totalCount);
        }

        // Category Processing
        const processedCats = itemsReceived.map(p => {
          const rawVal = p.category || "";
          return {
            raw: rawVal, // Keep for API calls (e.g., {"HARDWARE"})
            display: rawVal.replace(/[{}"]/g, "").trim() // Keep for UI labels (e.g., HARDWARE)
          };
        }).filter(c => c.display !== "");

        console.log("Categories extracted from current items:", processedCats);

        setCategories(prev => {
          const categoryMap = new Map();

          // Default "All" option
          categoryMap.set("All", { raw: "All", display: "All" });

          // Add existing categories from state
          prev.forEach(c => {
            const key = typeof c === 'string' ? c : c.display;
            categoryMap.set(key, typeof c === 'string' ? { raw: c, display: c } : c);
          });

          // Add new ones from this fetch
          processedCats.forEach(c => categoryMap.set(c.display, c));

          const finalCategories = Array.from(categoryMap.values());
          console.log("Final Unique Categories List (State):", finalCategories);
          return finalCategories;
        });
      } else {
        console.warn("API Response successful but data is empty.");
      }
    } catch (error) {
      console.error("Fetch Error Detail:", error);
      if (error.response) {
        console.error("Server Response Data:", error.response.data);
      }
    } finally {
      setLoading(false);
      console.log("--- API Request Finished ---");
    }
  }, [selectedCategory, priceFilter, searchTerm, page, sortOrder]);
  useEffect(() => {
    fetchViewerData();
  }, [selectedCategory, priceFilter, searchTerm, sortOrder]);

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">

      {view === "marketplace" && (
        <aside className="w-56 border-r border-slate-100 p-6 flex flex-col gap-8 hidden md:flex overflow-y-auto bg-white flex-shrink-0">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <HiOutlineFilter className="w-4 h-4" /> Filters
              </h3>
              {(selectedCategory !== "All" || priceFilter !== "All") && (
                <button
                  onClick={() => { setSelectedCategory("All"); setPriceFilter("All"); setShowAll(false); }}
                  className="text-[9px] font-black text-[#3674B5] uppercase hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-8">


              <div>
                <p className="text-[11px] font-black text-slate-900 mb-4 uppercase tracking-wider">Category</p>

                <div className="space-y-1">
                  {categories.map(catObj => {

                    const isObject = typeof catObj === 'object';
                    const rawValue = isObject ? catObj.raw : catObj;
                    const displayLabel = isObject ? catObj.display : catObj;

                    return (
                      <label key={displayLabel} className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all group ${selectedCategory === rawValue ? "bg-[#3674B5]/5" : "hover:bg-slate-50"}`}>
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === rawValue}
                            onChange={() => setSelectedCategory(rawValue)} // Stores the "messy" string for API
                            className="peer h-4 w-4 appearance-none rounded-full border border-slate-300 checked:border-[#3674B5] transition-all"
                          />
                          <div className="absolute w-2 h-2 rounded-full bg-[#3674B5] scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                        <span className={`text-xs capitalize transition-colors ${selectedCategory === rawValue ? 'font-bold text-[#3674B5]' : 'text-slate-500 group-hover:text-slate-900'}`}>
                          {displayLabel.toLowerCase()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[11px] font-black text-slate-900 mb-4 uppercase tracking-wider">Price Range</p>
                <div className="space-y-1">
                  {[{ label: "All Prices", value: "All" }, { label: "Under ₹500", value: "Under 500" }, { label: "₹500 - ₹1,000", value: "500-1000" }, { label: "Over ₹1,500", value: "Over 1500" }].map((range) => (
                    <label key={range.value} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group ${priceFilter === range.value ? "bg-[#3674B5]/5" : "hover:bg-slate-50"}`}>
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="priceRange" checked={priceFilter === range.value} onChange={() => setPriceFilter(range.value)} className="peer h-4 w-4 appearance-none rounded-full border border-slate-300 checked:border-[#3674B5] transition-all" />
                        <div className="absolute w-2 h-2 rounded-full bg-[#3674B5] scale-0 peer-checked:scale-100 transition-transform" />
                      </div>
                      <span className={`text-xs transition-colors ${priceFilter === range.value ? 'font-bold text-[#3674B5]' : 'text-slate-500 group-hover:text-slate-900'}`}>{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col min-w-0">

        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 flex-shrink-0">

          <div className="flex flex-col gap-1">
            <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="hover:text-[#3674B5] cursor-pointer">Home</span>
              <span className="text-slate-200">/</span>

              <span className="text-slate-900 capitalize">
                {selectedCategory.replace(/[{}"]/g, "").trim().toLowerCase()}
              </span>
            </nav>
            <div className="flex items-baseline gap-3">

              <span className="text-[10px] font-semibold text-slate-600">
                Showing 1-{products.length} of {totalItems} items
              </span>
            </div>
          </div>

          {/* Right: Functional Actions */}
          <div className="flex items-center gap-2">
            <div className="relative group">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-300 rounded cursor-pointer hover:border-slate-300 transition-all">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Sort by:</span>
                <span className="text-[11px] font-semibold font-black text-slate-900 uppercase">{sortOrder}</span>

              </div>

              {/* Dropdown Menu (Appears on Hover/Click) */}
              <div className="absolute right-0 mt-0 ml-4  w-36 bg-white border border-slate-300 rounded shadow-xl shadow-slate-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 overflow-hidden">
                {[
                  { label: "Relevance", value: "relevance" },
                  { label: "Price (Low to High)", value: "price-low" },
                  { label: "Price (High to Low)", value: "price-high" },

                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortOrder(option.value)}
                    className={`w-full text-left px-5 py-3 text-xs font-bold hover:bg-slate-50 transition-colors ${sortOrder === option.value ? "text-[#3674B5] bg-[#3674B5]/5" : "text-slate-600"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          {view === "marketplace" ? (
            <div className="max-w-6xl mx-auto">
              {loading && products.length === 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-slate-50 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : (
                <>

                  {!showAll && selectedCategory === "All" && searchTerm === "" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">

                        <button
                          onClick={() => setShowAll(true)}
                          className="ml-auto flex items-center gap-1  text-[11px] font-bold text-[#3674B5] uppercase tracking-wider hover:underline"
                        >
                          View All <HiOutlineChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Horizontal Scroll Container */}
                      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                        {products.slice(0, 8).map(product => (
                          <div key={product.id} className="min-w-[240px] snap-start">
                            <ProductCard
                              product={product}
                              onClick={() => { setSelectedProduct(product); setDrawerMode("details"); setIsSnapshotOpen(true); }}
                              onBuy={() => { setSelectedProduct(product); setDrawerMode("checkout"); setIsSnapshotOpen(true); }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* FULL GRID SECTION */
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      {products.map(product => (

                        // Inside your product mapping in Viewer.js
                        <ProductCard
                          key={product.id}
                          product={product}
                          onClick={() => {
                            setSelectedProduct(product);
                            setDrawerMode("details");
                            setIsSnapshotOpen(true);

                            const params = new URLSearchParams(window.location.search);
                            params.set("productId", product.id);
                            window.history.pushState(null, "", `?${params.toString()}`);
                          }}
                          onBuy={() => {
                            setSelectedProduct(product);
                            setDrawerMode("checkout");
                            setIsSnapshotOpen(true);

                            const params = new URLSearchParams(window.location.search);
                            params.set("productId", product.id);
                            window.history.pushState(null, "", `?${params.toString()}`);
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {(showAll || selectedCategory !== "All") && products.length < totalItems && (
                    <div className="mt-12 flex justify-center pb-8">
                      <button
                        onClick={() => fetchViewerData(true)}
                        className="px-8 py-3 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#3674B5] transition-colors shadow-lg shadow-slate-200"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <OrderHistory />
          )}
        </div>
      </main>

      <ProductSnapshot
        product={selectedProduct}
        isOpen={isSnapshotOpen}
        onClose={() => {
          setIsSnapshotOpen(false);

          const params = new URLSearchParams(window.location.search);
          params.delete("productId");
          const cleanUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
          window.history.pushState(null, "", cleanUrl);
        }}
        mode={drawerMode}
        onPurchaseSuccess={() => fetchViewerData()}
      />
    </div>
  );
};

export default Viewer;