import React, { useState, useEffect } from "react";
import axios from "axios";
import { parseFunction } from "./dynamic/utils/functionParser";
import { PRODUCT_MAPPING } from "./dynamic/utils/columnMapper";
import FormField from "./dynamic/FormField";

const AddProduct = ({ onClose, refreshData }) => {
  const [entities, setEntities] = useState([]);
  const [errors, setErrors] = useState({});

  // 1. Fetch the Admin-defined rules from MongoDB
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/forms/product-form");
        
        const initialized = res.data.entities.map((field) => ({
          ...field,
          // Hydrate the string from Monaco into a JS function
          parsed: parseFunction(field.jsSource, field.required),
          value: "" 
        }));
        setEntities(initialized);
      } catch (err) {
        console.error("Failed to load dynamic schema", err);
      }
    };
    fetchSchema();
  }, []);

  // 2. The Dynamic Change Handler
  const handleValueChange = (index, newValue) => {
    const updated = [...entities];
    const field = updated[index];
    field.value = newValue;
    setEntities(updated);

    // Run the Monaco-defined validation logic
    let validationError = null;
    if (field.parsed.validate) {
      validationError = field.parsed.validate(newValue);
    }
    setErrors(prev => ({ ...prev, [field.label]: validationError }));
  };

  // 3. The "Bridge" Save (To PostgreSQL)
  const onSave = async () => {
    const payload = {};
    entities.forEach(field => {
      const dbColumn = PRODUCT_MAPPING[field.label];
      if (dbColumn) payload[dbColumn] = field.value;
    });

    // Save to your existing Postgres API
    await axios.post("/api/products", payload);
    refreshData();
    onClose();
  };

  return (
    <div className="p-4 bg-white border border-[#3674B5] rounded-xl">
      {entities.map((f, i) => (
        <FormField 
          key={i}
          index={i}
          field={{...f, type: f.parsed.type, options: f.parsed.options}}
          onValueChange={handleValueChange}
          error={errors[f.label]}
        />
      ))}
      <button onClick={onSave} className="mt-4 bg-[#3674B5] text-white p-2 w-full rounded">
        Confirm Add Product
      </button>
    </div>
  );
};