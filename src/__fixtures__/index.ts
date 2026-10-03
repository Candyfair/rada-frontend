// Typed access to the API fixtures. JSON imports are typed with plain
// strings, so they are cast once here; src/types/api.test.ts checks at
// runtime that the values really match the declared unions.
import type { ApiError, Asset, AssetHistoryRange, AssetSnapshot, FleetSummary } from "@/types/api";
import rangeJson from "./asset-history-range.json";
import snapshotJson from "./asset-history-snapshot.json";
import notFoundJson from "./asset-not-found.json";
import assetsJson from "./assets.json";
import summaryJson from "./summary.json";

export const assets = assetsJson as Asset[];
export const summary = summaryJson as FleetSummary;
export const historySnapshot = snapshotJson as AssetSnapshot;
export const historyRange = rangeJson as AssetHistoryRange;
export const assetNotFound = notFoundJson as ApiError;
