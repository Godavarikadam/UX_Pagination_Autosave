import React, { useState, useContext } from "react";
import LedgerTable from "../components/ledger/LedgerTable";
import ProductDrawer from "../components/drawer/ProductDrawer";
import { AuthContext } from "../context/AuthContext";

function LedgerPage() {
  const { user } = useContext(AuthContext);
  const [tableUpdater, setTableUpdater] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRowClick = (product, updater) => {
    setSelectedProduct(product);
    setTableUpdater(() => updater);
    setDrawerOpen(true);
  };

  return (
 
    <div className="flex flex-col h-full max-w-[1400px] mx-auto">
  <div className="flex-1 min-h-0 bg-white   shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">

    <div className="flex-1  overflow-y-auto custom-scrollbar">
      <LedgerTable onRowClick={handleRowClick} />
    </div>
  </div>

  {/* DRAWER */}
  {selectedProduct && (
    <ProductDrawer
      product={selectedProduct}
      isOpen={drawerOpen}
      onClose={() => {
        setDrawerOpen(false);
        setSelectedProduct(null);
      }}
      onSave={tableUpdater} 
      readOnly={user?.role !== "admin"}
    />
  )}
</div>
  );
}

export default LedgerPage;




