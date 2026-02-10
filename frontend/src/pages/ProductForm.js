import React, { useState, useEffect } from "react";
import FormField from "../components/dynamic/FormField";
import JsEditor from "../components/dynamic/JsEditor";
import Preview from "../components/dynamic/Preview";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaCode, FaDatabase, FaLayerGroup, FaSearch } from "react-icons/fa";
import { HiArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { parseFunction } from "../components/dynamic/utils/functionParser";

const ProductForm = () => {
  const [entities, setEntities] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0); 
  const [previewErrors, setPreviewErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

const hasErrors = entities.some(f => f.syntaxError) || Object.values(previewErrors).some(Boolean);
  const token = sessionStorage.getItem("token");


useEffect(() => {
 
  console.log("Effect Fired. Token status:", token);

  const initializeForm = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching schema from backend...");
      
      const [sqlRes, mongoRes] = await Promise.all([
        axios.get("http://localhost:5000/api/forms/schema/products"), // Removed token for debug
        axios.get("http://localhost:5000/api/forms/get/product-form")  // Removed token for debug
      ]);

      if (sqlRes.data.success) {
        const sqlColumns = sqlRes.data.columns;
        const savedEntities = mongoRes.data?.entities || []; 
        
        const dynamicFields = sqlColumns
          .filter(col => !['id', 'created_at', 'updated_at', 'updated_by', 'status'].includes(col.name))
          .map(col => {
            const savedField = savedEntities.find(s => (s.dbKey || s.db_key) === col.name);
            const finalJs = savedField?.jsSource || `function validate(v) {\n  return null;\n}`;
            const isRequired = !!(savedField?.required || savedField?.validation?.required);
            
            const parsed = parseFunction(finalJs, isRequired);
            return {
              label: savedField?.label || col.name.toUpperCase().replace(/_/g, " "),
              dbKey: col.name,
              required: isRequired,
              jsSource: finalJs,
              type: parsed.type || "text",
              options: parsed.options || [],
              parsedFn: parsed,
            value: savedField?.value || (parsed.type === "checkbox" ? [] : ""),
              syntaxError: null
            };
          });
          
        setEntities(dynamicFields);
        
      }
    } catch (err) {
      console.error("FAILED: API request error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  initializeForm(); 
}, [token]);

  const toggleRequired = (index) => {
    setEntities(prev => {
      const arr = [...prev];
      arr[index] = { ...arr[index], required: !arr[index].required };
      return arr;
    });
  };

const updateLogic = (index, code) => {
  setEntities(prev => {
    const arr = [...prev];
    let syntaxError = null;
    
    const pureJs = code.replace(/^(dropdown|radio|checkbox)\{.*?\}/s, "").trim();

    try {
     
      new Function(pureJs); 
    } catch (err) {
      syntaxError = err.message;
    }

    // 2. Pass the code to the parser (ensure you've updated parseFunction.js too!)
    const parsed = parseFunction(code, arr[index].required);

    arr[index] = {
      ...arr[index],
      jsSource: code,
      type: parsed.type || "text",
      options: parsed.options || [],
      parsedFn: parsed,
      syntaxError: syntaxError 
    };
    return arr;
  });
};
  const handleFieldChange = (idx, newVal) => {
    setEntities(prev => {
      const arr = [...prev];
      arr[idx] = { ...arr[idx], value: newVal };
      const f = arr[idx];
      let err = null;
      if (f.parsedFn?.validate) {
        try { err = f.parsedFn.validate(newVal); } catch { err = "Invalid input"; }
      }
      if (!err && f.required) {
        if (f.type === "text" && (!newVal || String(newVal).trim() === "")) err = `${f.label} is required`;
        if ((f.type === "dropdown" || f.type === "radio") && !newVal) err = `${f.label} is required`;
        if (f.type === "checkbox" && (!newVal || newVal.length === 0)) err = `${f.label} is required`;
      }
      setPreviewErrors(prev => ({ ...prev, [f.label]: err }));
      return arr;
    });
  };

  const toggleCheckbox = (idx, value, checked) => {
    setEntities(prev => {
      const arr = [...prev];
      const f = { ...arr[idx] };
      const selected = Array.isArray(f.value) ? f.value : [];
      f.value = checked ? [...selected, value] : selected.filter(v => v !== value);
      let err = null;
      if (f.parsedFn?.validate) {
        try { err = f.parsedFn.validate(f.value); } catch { err = "Validation failed"; }
      }
      if (!err && f.required && f.value.length === 0) err = `${f.label} is required`;
      setPreviewErrors(prev => ({ ...prev, [f.label]: err }));
      arr[idx] = f;
      return arr;
    });
  };

 const handleSubmit = async () => {
  if (entities.length === 0) return toast.error("Please add at least one field.");

  
  for (let f of entities) {
    try {
 
      const pureJs = f.jsSource.replace(/^(dropdown|radio|checkbox)\{.*?\}/s, "").trim();
      new Function(pureJs); 
      } catch (err) {
    
      return toast.error(`Cannot save! Syntax error in ${f.label}: ${err.message}`);
    }
  }
  if (Object.values(previewErrors).some(Boolean)) {
    return toast.error("Fix validation errors in the preview before saving");
  }
  const payloadEntities = entities.map(e => ({
    label: e.label,
    dbKey: e.dbKey,
    type: e.type,
    options: e.options,
    jsSource: e.jsSource,
    required: e.required,
  }));

  try {
    const res = await axios.post(
      "http://localhost:5000/api/forms/save",
      { entities: payloadEntities },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data.success) toast.success("All schema logic saved!");
    if (window.refreshActivityLogs) window.refreshActivityLogs();
  } catch (err) {
    toast.error(err.response?.data?.error || "Save failed.");
  }
}; 


  const currentField = entities[selectedIndex];

  return (
    <div className="h-[calc(100vh-64px)] bg-[#f0f4f8] flex overflow-hidden">
      
      <div className="w-62 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b bg-gray-50 flex flex-col gap-3">
         
          <div className="relative">
            <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
            <input 
              type="text" 
              placeholder="Search columns..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[12px] text-black outline-none focus:border-[#3674B5]"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {entities
            .filter(f => f.label.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((f, i) => {
              const originalIndex = entities.findIndex(e => e.dbKey === f.dbKey);
              return (
                <button 
                  key={f.dbKey}
                  onClick={() => setSelectedIndex(originalIndex)}
                  className={`w-full bg-gray-100 text-left text-[12px] px-4 py-4 border-b border-gray-200 flex items-center justify-between transition-all group ${selectedIndex === originalIndex ? 'bg-blue-50 border-r-2 border-r-[#3674B5]' : 'hover:bg-gray-50'}`}
                >
                  <div className="truncate pr-2 ">
                    <p className={`text-[10px] font-bold truncate ${selectedIndex === originalIndex ? 'text-[#3674B5]' : 'text-gray-600'}`}>{f.label}</p>
                    <p className="text-[9px] font-mono text-gray-400">{f.dbKey}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {f.required && <span className="w-1 h-1 rounded-full bg-red-500"></span>}
                   
                  </div>
                </button>
              );
          })}
        </div>
      </div>


<div className="flex-1 flex flex-col px-3  overflow-hidden bg-gray-100 min-w-[600px]">
  <div className="bg-white rounded-md shadow-xl border border-gray-200 flex flex-col h-60vh overflow-hidden">
  
    <div className="p-3 border-b border-gray-200 mb-6 flex justify-between items-center bg-white">


<div className="flex  items-center gap-4">
 
  <button 
    onClick={() => navigate('/products')} 
    className="p-1 -ml-1 rounded-full  bg-gray-200 hover:bg-gray-300 transition-colors group"
    title="Back to Products"
  >
    <HiArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-[#3674B5]" />
  </button>

  <div className="flex flex-col">
    <div className="flex items-center gap-2">
      <h1 className="text-[11px] font-black text-gray-800 uppercase">
        {currentField?.label}
      </h1>
   
      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#3674B5] text-[9px] font-bold border border-blue-100 uppercase">
        {currentField?.type || 'text'}
      </span>
    </div>
    <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
      <span className="opacity-100">db_key:</span> {currentField?.dbKey}
    </p>
  </div>
</div>

  {/* Right: Controls & Logic Health */}
  <div className="flex items-center gap-4">
    <label className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-md cursor-pointer border border-gray-100 hover:border-gray-300 transition-all">
        <span className={`text-[11px] font-semibold font-black ${currentField?.required ? 'text-[#3674B5]' : 'text-gray-400'}`}>
          Required
        </span>
        <input 
          type="checkbox" 
          checked={currentField?.required} 
          onChange={() => toggleRequired(selectedIndex)}
          className="w-3.5 h-3.5 rounded border-gray-300 text-[#3674B5] focus:ring-[#3674B5]" 
        />
      </label>
  </div>
</div>

    {/* Editor Section - Flex-1 takes available space */}
    <div className="flex-1 relative bg-[#1e1e1e]">
      <JsEditor 
        value={currentField?.jsSource} 
        setValue={(val) => updateLogic(selectedIndex, val)} 
      />
      {currentField?.syntaxError && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-400/90 backdrop-blur-sm text-black text-[10px] px-6 py-2 font-normal flex items-center justify-between z-10">
          <span className="truncate pr-2">Current Field Error: {currentField.syntaxError}</span>
        
        </div>
      )}
    </div>

    {entities.some(e => e.syntaxError) && (
      <div className="h-3/4 border-t border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
          <span className="text-[12px] font-black text-red-600 font-semibold flex items-center gap-2">
           
            Fix ({entities.filter(e => e.syntaxError).length}) errors
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-white">
          <div className="space-y-2">
            {entities.filter(e => e.syntaxError).map((f) => (
              <div 
                key={f.dbKey}
                onClick={() => setSelectedIndex(entities.findIndex(ent => ent.dbKey === f.dbKey))}
                className="group flex items-start gap-3 p-1 rounded border border-red-100 bg-red-50/30 hover:bg-red-50 cursor-pointer transition-all"
              >
                <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded mt-0.5 shrink-0 uppercase">
                  {f.label}
                </span>
                <span className="text-[11px] text-gray-600 font-mono truncate">
                  {f.syntaxError}
                </span>
                <span className="ml-auto text-[9px] text-red-400 opacity-0 group-hover:opacity-100 font-bold uppercase">
                  Fix Now →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
</div>

      {/* 3. RIGHT: PREVIEW PANEL */}
      <div className="w-[460px] bg-white border-l pb-5 border-gray-200 flex flex-col shadow-2xl">
        <div className="p-2"><Preview onSave={handleSubmit} count={entities.length} disabled={hasErrors}/></div>
        
        <div className="flex-1 overflow-y-auto px-6 py-1 space-y-1  custom-scrollbar">
    
          <div className="space-y-4">
            {entities.map((f, i) => (
              <div 
                key={f.dbKey} 
                className={`transition-all duration-300 transform ${selectedIndex === i ? 'scale-[1.02]' : 'opacity-60 grayscale-[0.5]'}`}
              >
                <div className={` border transition-all ${selectedIndex === i ? 'bg-white border-[#3674B5] shadow-lg ring-2 ring-blue-50' : 'bg-gray-50 border-gray-300'}`}>
                  <FormField
                    field={f}
                    index={i}
                    onValueChange={handleFieldChange}
                    onCheckboxToggle={toggleCheckbox}
                    error={previewErrors[f.label]}
                    
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductForm;