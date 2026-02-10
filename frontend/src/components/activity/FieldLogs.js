import React from 'react';
import { HiOutlineCode } from "react-icons/hi";

const FieldLogs = ({ a, handleRestore }) => (
  
  <div key={`logic-${a.id}`} className="min-h-[110px] flex flex-col rounded-md border border-slate-300 bg-white p-1 shadow-xl mb-2">
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center gap-1">
        <HiOutlineCode className="text-slate-500 w-3 h-3" />
        <span className="text-[9px] font-semibold font-black text-slate-800 uppercase px-2 py-0.5 rounded bg-white">
          {a.field_name || "Logic Update"}
        </span>
      </div>
      <span className="text-[9px] text-slate-500 font-mono">
        {new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
      </span>
    </div>

   
<div className="font-mono text-[11px] leading-relaxed bg-white p-2 rounded border border-white/5 overflow-x-auto">
  {(() => {
    // 🟢 FIX: Add fallbacks to prevent .split() on null/undefined
    const oldLines = (a.old_logic || "").split('\n');
    const newLines = (a.new_logic || "").split('\n');
    
    const diff = newLines.map((line, i) => {
      if (line !== oldLines[i]) return { type: 'change', old: oldLines[i], new: line };
      return null;
    }).filter(x => x);

    if (diff.length === 0) return <span className="text-slate-500 italic">No structural logic changes</span>;

    return diff.map((change, idx) => (
      <div key={idx} className="mb-2 last:mb-0">
        {change.old !== undefined && (
          <div className="text-rose-600/70 flex items-start gap-2 bg-rose-500/5 px-1">
            <span className="w-3 text-center">-</span>
            <code className="whitespace-pre">{change.old}</code>
          </div>
        )}
        <div className="text-emerald-600 flex items-start gap-2 bg-emerald-500/5 px-1">
          <span className="w-3 text-center">+</span>
          <code className="whitespace-pre">{change.new}</code>
        </div>
      </div>
    ));
  })()}
</div>

    <div className="border-white/5 flex justify-between items-center mt-auto">
      <span className="text-[9px] text-slate-500 font-semibold">
        Updated by User #{a.created_by}
      </span>
      <button 
        className="text-[7px]  font-semibold bg-gray-100 px-1 hover-bg-text-emerald-500 py-1 rounded uppercase text-black hover:bg-white transition-colors"
        onClick={() => handleRestore(a)} 
      >
        Restore
      </button>
    </div>
  </div>
);

export default FieldLogs;