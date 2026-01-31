import React from "react";
import { VscPreview } from "react-icons/vsc";
import { FaSave } from "react-icons/fa";
import {useNavigate} from "react-router-dom";


const Preview = ({ title = "Preview Section", onSave, disabled , count = 0 }) => {
  const navigate=useNavigate();

  return (
    <div className="flex justify-between items-center text-[14px] text-[#3674B5] border-b pb-4 font-normal py-2 mb-4 border-[#578FCA]">
      <span className="flex items-center gap-1 ">
        <div className="text-[#3674B5] font-normal text-[12px]" /> {title} 
      </span>
<div className="flex items-center gap-1">
<button 
    onClick={() => navigate("/products")} 
    className="text-[#3674B5] text-[11px] font-semibold px-2 py-1 border border-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 bg-gray-50 mr-2 hover:border-gray-400 "
  >
   Cancel
  </button>


      <button
        className="text-[#3674B5] text-[11px] font-semibold px-2 py-1 border border-gray-200 rounded hover:bg-blue-100 disabled:opacity-50 bg-gray-50 mr-2 hover:border-gray-300 "
       
        onClick={onSave}
        disabled={disabled}
      >
       
     {disabled ? 'Fix Errors to Save' : 'Save '}
      </button></div>
    </div>
  );
};

export default Preview;
