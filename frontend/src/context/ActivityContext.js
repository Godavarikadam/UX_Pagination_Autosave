import React, { createContext, useState, useEffect } from "react";
import { api } from "../services/api";

export const ActivityContext = createContext();

export const ActivityContextProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch last 5 activities from backend
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get("/activity?page=1&limit=5");
      const items = Array.isArray(res.data.items) ? res.data.items : [];
      setActivities(items);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, fetchActivities, loading }}>
      {children}
    </ActivityContext.Provider>
  );
};
