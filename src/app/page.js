"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAssets } from "@/hooks/useAssets";
import { useAssetDetail } from "@/hooks/useAssetDetail";
import { useTheme } from "@/context/ThemeContext";
import BubbleChart from "@/components/BubbleChart/BubbleChart";
import Toggle from "@/components/UI/Toggle";
import FilterModal from "@/components/UI/FilterModal";
import HomeHeader from "@/components/Layout/HomeHeader";
import DetailPanel from "@/components/Layout/DetailPanel";
import TotalPowerBadge from "@/components/Layout/TotalPowerBadge";
import AssetDetailPage from "@/components/AssetDetail/AssetDetailPage";
import StatsModal from "@/components/Graphs/StatsModal";

export default function Home() {
  const { assets, loading, error } = useAssets();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [metric, setMetric] = useState("power_mw");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isThemeSpinning, setIsThemeSpinning] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(["all"]));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLogoutMenuOpen, setIsLogoutMenuOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLogoutOpen, setIsDetailLogoutOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Hardcoded until the grid signal API is connected
  const TOTAL_POWER = 5000;

  // ------------------------------------------------------------------
  // DERIVED STATE
  // ------------------------------------------------------------------
  const filteredAssets = useMemo(() => {
    if (activeFilters.has("all")) return assets;
    return assets.filter((a) => activeFilters.has(a.asset_type));
  }, [assets, activeFilters]);

  const showToggle = activeFilters.size === 1 && activeFilters.has("battery");
  const effectiveMetric = showToggle ? metric : "power_mw";

  // Fetch detail data only when the detail page is open
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useAssetDetail(isDetailOpen ? selectedAsset?.id : null);

  // ------------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------------
  function handleBubbleSelect(asset) {
    setSelectedAsset(asset);
  }

  function handleDismiss() {
    setSelectedAsset(null);
  }

  function handleThemeToggle() {
    if (isThemeSpinning) return;
    setIsThemeSpinning(true);
    setTimeout(() => {
      toggleTheme();
      setIsThemeSpinning(false);
    }, 350);
  }

  function handleFilterChange(newFilters) {
    setActiveFilters(newFilters);
    if (selectedAsset && !newFilters.has("all")) {
      const stillVisible = newFilters.has(selectedAsset.asset_type);
      if (!stillVisible) setSelectedAsset(null);
    }
  }

  function handleSettingsPress() {
    const opening = !isLogoutMenuOpen;
    setIsLogoutMenuOpen(opening);
    setIsFilterOpen(opening);
  }

  function handleOpenDetail() {
    setIsDetailOpen(true);
  }

  function handleCloseDetail() {
    setIsDetailOpen(false);
    setIsDetailLogoutOpen(false);
  }

  function handleDetailLogout() {
    setIsDetailOpen(false);
    setIsDetailLogoutOpen(false);
    setSelectedAsset(null);
    router.push("/login");
  }

  function handleHomeLogout() {
    setIsLogoutMenuOpen(false);
    setIsFilterOpen(false);
    router.push("/login");
  }

  // ------------------------------------------------------------------
  // LOADING / ERROR STATES
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div style={styles.centeredScreen}>
        <p style={styles.statusText}>Loading assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centeredScreen}>
        <p style={styles.statusText}>Error: {error}</p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <>
      <style>{`
        @keyframes spin-once {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <main style={styles.root}>

        {/* ---- BUBBLE MAP ---- */}
        <div style={styles.mapWrapper} onClick={handleDismiss}>
          <BubbleChart
            assets={filteredAssets}
            metric={effectiveMetric}
            selectedId={selectedAsset?.id ?? null}
            onSelect={handleBubbleSelect}
          />
        </div>

        {/* ---- TOGGLE — visible only when filter is battery-only ---- */}
        {showToggle && (
          <div style={styles.toggleWrapper}>
            <Toggle value={metric} onChange={setMetric} />
          </div>
        )}

        {/* ---- TOTAL POWER BADGE ---- */}
        <TotalPowerBadge
          value={TOTAL_POWER}
          isExpanded={isFilterOpen}
          isDetailOpen={isDetailOpen}
        />

        {/* ---- HEADER ---- */}
        <HomeHeader
          theme={theme}
          isThemeSpinning={isThemeSpinning}
          onThemeToggle={handleThemeToggle}
          onChartPress={() => setIsStatsOpen(true)}
          onSettingsPress={handleSettingsPress}
          isLogoutMenuOpen={isLogoutMenuOpen}
          onLogoutMenuClose={() => setIsLogoutMenuOpen(false)}
          onLogout={handleHomeLogout}
          isDetailOpen={isDetailOpen}
        />

        {/* ---- DETAIL PANEL ---- */}
        <DetailPanel
          selectedAsset={selectedAsset}
          isDetailOpen={isDetailOpen}
          onDismiss={handleDismiss}
          onOpenDetail={handleOpenDetail}
          onOpenStats={() => {
            if (selectedAsset) {
              setIsStatsOpen(true);
            }}
          }       
        />

        {/* ---- FILTER MODAL ---- */}
        {isFilterOpen && (
          <FilterModal
            activeFilters={activeFilters}
            onChange={handleFilterChange}
            onClose={() => {
              setIsFilterOpen(false);
              setIsLogoutMenuOpen(false);
            }}
          />
        )}

        {/* ---- BLUR OVERLAY — active when detail page is open ---- */}
        <div style={{
          ...styles.blurOverlay,
          opacity: isDetailOpen ? 1 : 0,
          pointerEvents: "none",
        }} />

        {/* ---- DETAIL PAGE — slides in from the right ---- */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease",
          transform: isDetailOpen ? "translateX(0)" : "translateX(100%)",
          opacity: isDetailOpen ? 1 : 0,
          backgroundColor: "transparent",
          pointerEvents: isDetailOpen ? "auto" : "none",
        }}>
          <AssetDetailPage
            asset={selectedAsset}
            detail={detailData}
            loading={detailLoading}
            error={detailError}
            onBack={handleCloseDetail}
            onLogout={handleDetailLogout}
            isLogoutMenuOpen={isDetailLogoutOpen}
            onToggleLogout={() => setIsDetailLogoutOpen((prev) => !prev)}
          />
        </div>

        {/* ---- STATS MODAL ---- */}
        <StatsModal
          assetId={selectedAsset?.id ?? null}
          assets={assets}
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
        />

      </main>
    </>
  );
}

// -------------------------------------------------------------------
// STYLES
// -------------------------------------------------------------------
const styles = {
  root: {
    position: "relative",
    width: "100%",
    height: "100dvh",
    overflow: "hidden",
  },

  mapWrapper: {
    position: "absolute",
    inset: 0,
  },

  toggleWrapper: {
    position: "absolute",
    top: 50,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10,
  },

  blurOverlay: {
    position: "absolute",
    inset: 0,
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 45,
    transition: "opacity 0.35s ease",
    backgroundColor: "transparent",
  },

  centeredScreen: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100dvh",
  },

  statusText: {
    color: "var(--color-text-muted)",
    fontSize: 15,
  },
};