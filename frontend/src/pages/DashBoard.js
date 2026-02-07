import React, { useContext } from "react";
import { Outlet, useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ActivityFeed from "../components/activity/ActivityFeed";
import { HiOutlineClipboardList, HiSearch } from "react-icons/hi";

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // 🟢 Defensive check: ensure user exists before checking role
  const isAdmin = user?.role === "admin";

  const location = useLocation();
  const isProductsPage = location.pathname === "/products" || location.pathname === "/";
  const isLogicEditor = location.pathname === "/products/form";
  const isApprovalPage = location.pathname === "/approvals"; 
  
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = decodeURIComponent(searchParams.get("search") || "");

  React.useEffect(() => {
    if (isLogicEditor && !isAdmin) {
      navigate("/products");
    }
  }, [isLogicEditor, isAdmin, navigate]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("search", value);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };


  return (
    <div className="flex h-screen bg-white flex-col font-sans antialiased text-slate-200">
      {/* GLOBAL NAVBAR */}
      <header className="h-16 bg-[#3674B5] border-b border-white/5 flex items-center justify-between px-8 z-30 shrink-0">
        
        {/* LEFT: Branding & Navigation Links */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 mr-4">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-[#3674B5] font-black text-lg">A</span>
            </div>
            <h2 className="hidden lg:block text-xs font-bold tracking-widest text-white uppercase">Activity Monitor</h2>
          </div>

          <nav className="flex ml-8 items-center gap-2">
            {/* Products Link - Visible to All */}
            <Link 
              to="/products" 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                isProductsPage ? 'bg-white text-[#3674B5] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              
              <span className="text-[11px] font-bold uppercase tracking-tight">Products</span>
            </Link>

            {/* Approvals Link - Visible to All */}
            <Link 
              to="/approvals" 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                isApprovalPage ? 'bg-white text-[#3674B5] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
            
              <span className="text-[11px] font-bold uppercase tracking-tight">
                {isAdmin ? "Approvals" : "History"}
              </span>
            </Link>

            {/* SCHEMA LINK: Strictly Admin Only */}
            {isAdmin && (
               <Link 
               to="/products/form" 
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                 isLogicEditor ? 'bg-white text-[#3674B5] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'
               }`}
             >
          
               <span className="text-[11px] font-bold uppercase tracking-tight">Schema Logic</span>
             </Link>
            )}
          </nav>
        </div>

        {/* CENTER: Global Search */}
        <div className="flex-1 flex justify-center px-10">
          {isProductsPage && (
            <div className="relative group w-3/4 max-w-md">
              <input
                type="text"
                placeholder={isApprovalPage ? "Search requests..." : "Search products..."}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full text-black pl-10 pr-4 py-2 bg-white/95 text-[13px] border-transparent focus:ring-2 focus:ring-white/50 rounded-xl outline-none border shadow-sm transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <HiSearch className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>
 <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 border-r border-white/20 pr-6 text-white">
            <div className="text-right flex flex-col items-end">
              <p className="text-[11px] font-semibold leading-none">
                Welcome, {user?.email || 'User'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] uppercase bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-mono font-medium text-white/90">
                  {user?.role || 'Guest'} ID : {user?.id || '0'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-[9px] font-semibold text-white bg-red-500 rounded-lg px-3 py-2 hover:bg-red-600 transition-colors uppercase shadow-sm"
          >
            Logout
          </button>
        </div>

        
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar only on Product List - Hidden on Approvals and Schema pages */}
        {!isLogicEditor && (
          <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              <ActivityFeed isSidebarView={true} limit={15} />
            </div>
          </aside>
        )}

        {/* Main Content Wrapper */}
        <main className={`flex-1 overflow-hidden flex flex-col ${isProductsPage ? 'p-0 bg-slate-100/50' : 'p-0'}`}>
          <div className={`h-full w-full px-3 bg-white shadow-sm overflow-hidden ${isProductsPage ? ' border border-slate-200' : 'rounded-none'}`}>
            <div className="h-full">
              {/* Passing context ensures child components receive global state updates */}
              <Outlet context={{ searchTerm, isAdmin }} /> 
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;