import React, { useContext } from "react";
import { Outlet, useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ActivityFeed from "../components/activity/ActivityFeed";
import { HiSearch } from "react-icons/hi";
import Viewer from "./Viewer";
import OrderHistory from "../components/viewerSide/OrderHistory";

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // 🟢 Only one declaration needed
  
  // 🟢 Role Checks
  const isAdmin = user?.role === "admin";
  const isViewer = user?.role === "viewer";
  const isEditor = user?.role === "editor";

  // 🟢 Path Logic
  const isProductsPage = location.pathname === "/products" || location.pathname === "/";
  const isLogicEditor = location.pathname === "/products/form";
  const isApprovalPage = location.pathname === "/approvals"; 
  const isMyOrdersPage = location.pathname === "/my-orders"; // 🟢 Correctly placed
  
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = decodeURIComponent(searchParams.get("search") || "");

  // 🛡️ Security: Redirect non-admins away from Schema Logic
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
    <div className="flex h-screen bg-white flex-col font-sans antialiased">
      {/* GLOBAL NAVBAR */}
      <header className="h-16 bg-[#3674B5] border-b border-white/5 flex items-center justify-between px-8 z-30 shrink-0">
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 mr-4">
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-[#3674B5] font-black text-lg">A</span>
            </div>
            <h2 className="hidden lg:block text-xs font-bold tracking-widest text-white uppercase">Activity Monitor</h2>
          </div>

          <nav className="flex ml-8 items-center gap-2">
            <Link 
              to="/products" 
              className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase ${
                isProductsPage ? 'bg-white text-[#3674B5] shadow-md' : 'text-white/70 hover:bg-white/10'
              }`}
            >
              Products
            </Link>

            {/* 🟢 CONDITIONAL LINK */}
            {isAdmin || isEditor ? (
              <Link 
                to="/approvals" 
                className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase ${
                  isApprovalPage ? 'bg-white text-[#3674B5] shadow-md' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                Approvals
              </Link>
            ) : (
              <Link 
                to="/my-orders" 
                className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase ${
                  isMyOrdersPage ? 'bg-white text-[#3674B5] shadow-md' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                My Orders
              </Link>
            )}

            {isAdmin && (
               <Link 
               to="/products/form" 
               className={`px-3 py-1.5 rounded-lg transition-all text-[11px] font-bold uppercase ${
                 isLogicEditor ? 'bg-white text-[#3674B5] shadow-md' : 'text-white/70 hover:bg-white/10'
               }`}
             >
               Schema Logic
             </Link>
            )}
          </nav>
        </div>

        {/* CENTER: Search */}
        <div className="flex-1 flex justify-center px-10">
          {isProductsPage && (
            <div className="relative group w-3/4 max-w-md">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full text-black pl-10 pr-4 py-2 bg-white/95 text-[13px] rounded-xl outline-none border shadow-sm"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <HiSearch className="h-4 w-4" />
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: Profile & Logout */}
        <div className="flex items-center gap-2 text-white">
          <div className="text-right border-r border-white/20 pr-6">
            <p className="text-[11px] font-semibold">Welcome, {user?.email || 'User'}</p>
            <span className="text-[9px] uppercase bg-white/10 px-1.5 py-0.5 rounded">
              {user?.role || 'Guest'} ID : {user?.id || '0'}
            </span>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-[9px] font-semibold bg-red-500 rounded-lg px-3 py-2 hover:bg-red-600 transition-colors uppercase shadow-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Only for Staff */}
        {!isLogicEditor && !isViewer && (
          <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2">
              <ActivityFeed isSidebarView={true} limit={15} />
            </div>
          </aside>
        )}

        <main className={`flex-1 overflow-hidden flex flex-col ${isProductsPage ? 'bg-slate-100/50' : ''}`}>
          <div className={`h-full w-full bg-white overflow-hidden ${isProductsPage ? 'border-x border-slate-200' : ''}`}>
            <div className="h-full">
              {/* 🟢 ROLE-BASED RENDERING */}
              {isViewer ? (
                <>
                  {isProductsPage && <Viewer searchTerm={searchTerm} />}
                  {isMyOrdersPage && <OrderHistory />}
                </>
              ) : (
                <Outlet context={{ searchTerm, isAdmin, isEditor }} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;