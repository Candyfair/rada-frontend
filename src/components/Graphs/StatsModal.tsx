import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Asset } from "@/types/api";
import AssetComparisonChart from "./AssetComparisonChart";
import styles from "./StatsModal.module.css";

interface StatsModalProps {
  /** Asset pre-selected in the chart, if any */
  assetId: number | null;
  assets: Asset[];
  isOpen: boolean;
  onClose: () => void;
}

export default function StatsModal({ assetId, assets, isOpen, onClose }: StatsModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
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
        inert={!isOpen}
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
            {/* The chart is mounted only while the modal is open, so each
                opening starts from a clean state: selected assets, dates,
                loaded data. The key remounts it if the asset changes. */}
            {isOpen && (
              <AssetComparisonChart
                key={assetId ?? "none"}
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
