import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useDebounce } from "./useDebounce";

export function useAutoSave(productId, initialData) {
  const [value, setValue] = useState(initialData ?? {});
  const [saveStatus, setSaveStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isFirstRender = useRef(true);
  const lastTypedAt = useRef(0);

  // Wait 1 second after typing stops before sending to backend
  const debouncedValue = useDebounce(value, 1000);

  const handleChange = (newValue) => {
    lastTypedAt.current = Date.now();
    setValue(newValue);
    setSaveStatus("typing");
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!productId) return;

    const save = async () => {
      // Safety guard to ensure we don't save while user is actively hitting keys
      if (Date.now() - lastTypedAt.current < 500) return;

      setSaveStatus("saving");
      setErrorMessage("");

      try {
        // Send the entire debounced object
        const res = await api.patch(`/products/${productId}`, debouncedValue);
        
        setSaveStatus("saved");

        // 🟢 KEY FIX: Trigger refresh only AFTER successful consolidated save
        window.dispatchEvent(new Event("activityUpdated"));

      } catch (err) {
        setSaveStatus("error");
        setErrorMessage(err.response?.data?.message || "Auto-save failed");
      }
    };

    save();
  }, [debouncedValue, productId]);

  return {
    value,
    setValue: handleChange,
    saveStatus,
    errorMessage,
  };
}