// import React, { useContext } from "react";
// import { Outlet, useNavigate, useSearchParams, useLocation } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";
// import ActivityFeed from "../components/activity/ActivityFeed";

// function Dashboard() {
//   const { user, logout } = useContext(AuthContext);
//   const navigate = useNavigate();
//   const isAdmin = user?.role === "admin";

//   const location = useLocation();
//   // 🟢 Detect if we are in logic editor mode
//   const isLogicEditor = location.pathname === "/products/form";
  
//   const [searchParams, setSearchParams] = useSearchParams();
//   const searchTerm = decodeURIComponent(searchParams.get("search") || "");

// React.useEffect(() => {
//     if (isLogicEditor && !isAdmin) {
//       navigate("/products"); // Redirect to a safe user page
//     }
//   }, [isLogicEditor, isAdmin, navigate]);

//   const handleSearchChange = (e) => {
//     const value = e.target.value;
//     const newParams = new URLSearchParams(searchParams);
//     if (value) {
//       newParams.set("search", value);
//     } else {
//       newParams.delete("search");
//     }
//     newParams.set("page", "1");
//     setSearchParams(newParams);
//   };

//   const handleLogout = () => {
//     logout();
//     navigate("/login", { replace: true });
//   };

//   return (
//     <div className="flex h-screen bg-white flex-col font-sans antialiased text-slate-200">
//       <header className="h-16 bg-[#3674B5] border-b border-white/5 flex items-center justify-between px-8 z-30 shrink-0">
//         <div className="flex items-center gap-12">
//           <div className="flex items-center gap-2">
//             <div className="h-6 w-6 bg-gray-300 rounded-lg flex items-center justify-center shadow-lg">
//               <span className="text-black font-bold text-sm">A</span>
//             </div>
//             <h2 className="text-sm font-bold tracking-wider text-white uppercase">Activity Monitor</h2>
//           </div>
        
//           {/* 🟢 HIDE GLOBAL SEARCH IF IN LOGIC EDITOR */}
//           {!isLogicEditor && (
//             <div className="relative group hidden md:block">
//               <input
//                 type="text"
//                 placeholder="Search products by id or name..."
//                 value={searchTerm}
//                 onChange={handleSearchChange}
//                 className="text-black pl-10 pr-4 py-1.5 w-96 bg-white text-[14px] border-transparent focus:ring-1 focus:ring-gray-500 rounded-lg transition-all duration-200 outline-none border"
//               />
//               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
//                 </svg>
//               </span>
//             </div>
//           )}

//           {/* 🟢 SHOW BREADCRUMB IF IN LOGIC EDITOR */}
//           {isLogicEditor && (
            
//             <div className="flex items-center gap-2 text-white/60 text-[11px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-4">
             
//               <span className="text-white-200">Field Schema Editor</span>
//             </div>
//           )}
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="flex items-center gap-4 border-r border-white/20 pr-6 text-white">
//             <div className="text-right flex flex-col items-end">
//               <p className="text-[11px] font-semibold leading-none">Welcome, {user?.email}</p>
//               <div className="flex items-center gap-2 mt-1.5">
//                 <span className="text-[9px] uppercase bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-mono font-medium text-white/90">
//                   {user?.role} ID : {user?.id}
//                 </span>
//               </div>
//             </div>
//           </div>
//           <button 
//             onClick={handleLogout} 
//             className="text-[9px] font-semibold text-white bg-red-500 rounded-lg px-3 py-2 hover:bg-red-600 transition-colors uppercase shadow-sm"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       <div className="flex flex-1 overflow-hidden">
//         {/* Activity Log Sidebar (Hidden in Editor) */}
//         {!isLogicEditor && (
//           <aside className="w-80 bg-gray-100 border-r border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
//             {/* <div className="px-8 ml-20 py-2 flex items-center justify-between">
//               <h3 className="text-[11px] bg-white rounded-lg px-2 py-2 font-bold text-slate-600 uppercase">Activity Log</h3>
//             </div> */}
//             <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
//               <ActivityFeed isSidebarView={true} limit={15} />
//             </div>
//           </aside>
//         )}

//         {/* Main Content Area */}
//         <main className={`flex-1 overflow-hidden flex flex-col ${isLogicEditor ? 'p-0' : 'p-1'}`}>
//           <div className={`h-full w-full bg-white shadow-2xl overflow-hidden ${isLogicEditor ? 'rounded-none' : 'rounded-lg'}`}>
//             <div className="h-full">
//               <Outlet context={{ searchTerm }} /> 
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;


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
      <header className="h-16 bg-[#3674B5] border-b border-white/5 flex items-center justify-between px-8 z-30 shrink-0">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gray-300 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-black font-bold text-sm">A</span>
            </div>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">Activity Monitor</h2>
          </div>

          {/* 🟢 NAV LINK: Shows for both Admin and User */}
          {!isLogicEditor && (
            <Link 
              to="/approvals" 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                isApprovalPage ? 'bg-white/20 text-white shadow-inner' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <HiOutlineClipboardList size={18} />
              <span className="text-[12px] font-bold uppercase tracking-tight">
                {isAdmin ? "Approvals" : "My Requests"}
              </span>
            </Link>
          )}
        
          {!isLogicEditor && !isApprovalPage && (
            <div className="relative group hidden md:block">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="text-black pl-10 pr-4 py-1.5 w-80 bg-white text-[14px] border-transparent focus:ring-1 focus:ring-gray-500 rounded-lg outline-none border"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <HiSearch className="h-4 w-4" />
              </span>
            </div>
          )}

          {isLogicEditor && (
            <div className="flex items-center gap-2 text-white/60 text-[11px] font-bold uppercase tracking-widest">
              <span className="text-white-200">Field Schema Editor</span>
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar hides if in Logic Editor OR on Approval Page */}
        {!isLogicEditor && !isApprovalPage && (
          <aside className="w-80 bg-gray-100 border-r border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              <ActivityFeed isSidebarView={true} limit={15} />
            </div>
          </aside>
        )}

        <main className={`flex-1 overflow-hidden flex flex-col ${(isLogicEditor || isApprovalPage) ? 'p-0' : 'p-1'}`}>
          <div className={`h-full w-full bg-white shadow-2xl overflow-hidden ${(isLogicEditor || isApprovalPage) ? 'rounded-none' : 'rounded-lg'}`}>
            <div className="h-full">
              {/* 🟢 Passing isAdmin down to Outlet ensures child components know role immediately */}
              <Outlet context={{ searchTerm, isAdmin }} /> 
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;