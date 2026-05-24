import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import BatteryComparisonChart from "./BatteryComparisonChart";
import styles from "./StatsModal.module.css";

// assetId  — pre-selected asset id (from detail page), or null (from main page)
// assets   — full asset list from useAssets(), used to populate the battery selector
// isOpen   — controls visibility
// onClose  — callback to close the modal
export default function StatsModal({ assetId, assets, isOpen, onClose }) {
  const scrollRef = useRef(null);

  // Reset scroll position to top each time the modal opens
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  // Close on Escape key (accessibility)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Filter batteries from the full asset list for the selector
  const batteries = (assets ?? []).filter((a) => a.asset_type === "battery");

  return (
    <>
      {/* Backdrop — clicking it closes the modal */}
      <div
        className={`${styles.overlay} ${isOpen ? "" : styles.hidden}`}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={`${styles.sheet} ${isOpen ? "" : styles.hidden}`}
        role="dialog"
        aria-modal="true"
        aria-label="Fleet statistics"
      >
        {/* Drag handle — visual only for now */}
        <div className={styles.handle} />

        <div className={styles.header}>
          <h2 className={styles.title}>Compare batteries</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.scrollContent} ref={scrollRef}>
          <div className={styles.section}>
            <BatteryComparisonChart
              initialAssetId={assetId}
              batteries={batteries}
            />
          </div>

          {/* Placeholder for future graphs */}
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Compare something else</p>
            {/* Additional charts will be added here */}
          </div>
        </div>
      </div>
    </>
  );
}