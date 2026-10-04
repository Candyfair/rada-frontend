// -------------------------------------------------------------------
// Shapes of the backend API responses, as proxied by /api/*.
// Written from real responses (see src/__fixtures__). The enum-like
// values are declared as runtime arrays so tests can check that the
// fixtures stay in sync with these types.
// -------------------------------------------------------------------

export const ASSET_TYPES = ["battery", "solar", "wind"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const OPERATIONAL_MODES = ["active", "fault", "curtailed"] as const;
export type OperationalMode = (typeof OPERATIONAL_MODES)[number];

export const ASSET_STATUSES = ["communicating", "unreachable"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

/** "S" = latest snapshot, "D" = time range */
export const HISTORY_MODES = ["S", "D"] as const;
export type HistoryMode = (typeof HISTORY_MODES)[number];

/** Metrics the bubble chart can be sized by */
export type BubbleMetric = "power_mw" | "energy_mwh";

/** Item of GET /assetslist */
export interface Asset {
  id: number;
  asset_type: AssetType;
  eic_code: string;
  name: string;
  max_capacity_mwh: number;
  max_charge_rate_mw: number;
  max_discharge_rate_mw: number;
  reactive_power_capacity_mvar: number;
  efficiency: number;
  soc_id: number;
  operational_mode: OperationalMode;
  asset_status: AssetStatus;
  energy_mwh: number;
  /** Negative when a battery is charging */
  power_mw: number;
  reactive_power_mvar: number;
  power_factor: number;
  /** UTC ISO 8601 timestamp with offset */
  last_updated: string;
}

/** One state-of-charge measurement of an asset */
export interface SocRecord {
  /** UTC ISO 8601 timestamp with offset */
  timestamp: string;
  operational_mode: OperationalMode;
  asset_status: AssetStatus;
  energy_mwh: number;
  power_mw: number;
  reactive_power_mvar: number;
  power_factor: number;
  voltage: number;
  current_amps: number;
  temperature_celsius: number;
}

interface AssetHistoryBase {
  asset_id: number;
  asset_name: string;
  eic_code: string;
  asset_type: AssetType;
  max_capacity_mwh: number;
}

/** GET /assets/{id}/soc?mode=S */
export interface AssetSnapshot extends AssetHistoryBase {
  record: SocRecord;
}

/** GET /assets/{id}/soc?mode=D */
export interface AssetHistoryRange extends AssetHistoryBase {
  record_count: number;
  resolution_minutes: number;
  downsampled: boolean;
  /** UTC timestamps, without offset */
  from_ts: string;
  to_ts: string;
  records: SocRecord[];
}

export interface FleetTotals {
  power_mw: number;
  energy_mwh: number;
  asset_count: number;
}

/** GET /assets/summary */
export interface FleetSummary {
  total_power_mw: number;
  total_energy_mwh: number;
  total_reactive_mvar: number;
  by_asset_type: Record<"all" | AssetType, FleetTotals>;
}

/** Error body returned by the backend and by the /api/* routes */
export interface ApiError {
  detail: string;
}
