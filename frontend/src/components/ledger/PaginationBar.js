import React, { useState, useEffect } from "react";

function PaginationBar({ page, totalPages, limit, setLimit, setPage }) {
  const [inputPage, setInputPage] = useState(page);
  const [inputLimit, setInputLimit] = useState(limit);

  useEffect(() => {
    setInputPage(page);
    setInputLimit(limit);
  }, [page, limit]);

  return (
    <div className="flex items-center justify-between">
      
      <div className="flex items-center gap-2">
  <span className="text-[10px] font-semibold font-black text-gray-500 uppercase">
    Entries per page :
  </span>
  <select
    value={limit}
    onChange={(e) => setLimit(parseInt(e.target.value))}
    className="h-7 px-1 text-center text-[11px] font-semibold text-[#3674B5] bg-white border border-slate-200 rounded-md outline-none focus:border-[#3674B5] cursor-pointer hover:bg-slate-50 transition-colors"
  >
    <option value={5}>5</option>
    <option value={10}>10</option>
    <option value={15}>15</option>
    <option value={20}>20</option>
    <option value={50}>50</option>
  </select>
</div>
      <div className="flex items-center gap-1  p-1 rounded-lg border border-gray-300 w-fit">

  <button
    disabled={page === 1}
    onClick={() => setPage(1)}
    className="p-1 rounded-md text-slate-400 hover:text-[#3674B5] hover:bg-white disabled:opacity-20 transition-all active:scale-90 border border-gray-200 focus:border-[#3674B5]"
    title="First Page"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  </button>


  <button
    disabled={page === 1}
    onClick={() => setPage(page - 1)}
    className="p-1.5 rounded-lg text-slate-400 hover:text-[#3674B5] hover:bg-white disabled:opacity-20 transition-all active:scale-90 focus:border-[#3674B5]"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
    </svg>
  </button>

  {/* Page Numbers */}
  <div className="flex items-center gap-1 px-1">
    {[...Array(totalPages)].map((_, index) => {
      const pageNum = index + 1;
      // Optional: Logic to limit shown pages if totalPages is high (e.g., only show 5 pages)
      if (totalPages > 4 && (pageNum > page + 1 || pageNum < page - 1) && pageNum !== 1 && pageNum !== totalPages) {
          if (pageNum === page + 2 || pageNum === page - 2) return <span key={pageNum} className="text-slate-400  text-[10px]">...</span>;
          return null;
      }

      return (
        <button
          key={pageNum}
          onClick={() => setPage(pageNum)}
          className={`min-w-[22px] h-5 px-1 rounded-md text-[10px] font-semibold font-black transition-all ${
            page === pageNum
              ? "bg-white text-[#3674B5] shadow-sm border border-slate-200 focus:border-[#3674B5]"
              : "text-slate-500 hover:text-[#3674B5] hover:bg-white/50 focus:border-[#3674B5]"
          }`}
        >
          {pageNum}
        </button>
      );
    })}
  </div>

  {/* Next Button */}
  <button
    disabled={page >= totalPages}
    onClick={() => setPage(page + 1)}
    className="p-1.5 rounded-lg text-slate-400 hover:text-[#3674B5] hover:bg-white disabled:opacity-20 transition-all active:scale-90 focus:border-[#3674B5]"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
    </svg>
  </button>

  {/* Last Page Button */}
  <button
    disabled={page >= totalPages}
    onClick={() => setPage(totalPages)}
    className="p-1.5 rounded-lg text-slate-400 hover:text-[#3674B5] hover:bg-white disabled:opacity-20 transition-all active:scale-90 border border-gray-200 focus:border-[#3674B5]"
    title="Last Page"
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  </button>
</div>



    </div>
  );
}

export default PaginationBar;
