import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import AssetComparisonChart from "./AssetComparisonChart";
import styles from "./StatsModal.module.css";

export default function StatsModal({ assetId, assets, isOpen, onClose }) {
  const scrollRef = useRef(null);
  // Increment this key each time the modal opens to fully remount the chart
  // and reset all its internal state — selected assets, dates, loaded data
  const mountKeyRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      mountKeyRef.current += 1;
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? "" : styles.hidden}`} onClick={onClose} />
      <div
        className={`${styles.sheet} ${isOpen ? "" : styles.hidden}`}
        role="dialog"
        aria-modal="true"
        aria-label="Fleet statistics"
      >
        <div className={styles.handle} />
        <div className={styles.header}>
          <h2 className={styles.title}>Compare assets</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className={styles.scrollContent} ref={scrollRef}>
          <div className={styles.section}>
            {/* key forces a full remount each time the modal opens,
                which resets all state inside AssetComparisonChart */}
            {isOpen && (
              <AssetComparisonChart
                key={mountKeyRef.current}
                initialAssetId={assetId}
                assets={assets}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
