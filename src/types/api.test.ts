import { describe, expect, it } from "vitest";
import assets from "@/__fixtures__/assets.json";
import range from "@/__fixtures__/asset-history-range.json";
import snapshot from "@/__fixtures__/asset-history-snapshot.json";
import summary from "@/__fixtures__/summary.json";
import { ASSET_STATUSES, ASSET_TYPES, OPERATIONAL_MODES } from "./api";

// JSON imports are typed with plain strings, so the unions of api.ts cannot
// be checked by the compiler: check the fixture values at runtime instead.
const records = [snapshot.record, ...range.records];

describe("API fixtures match the declared types", () => {
  it("only use known asset types", () => {
    const types = [...assets, snapshot, range].map((a) => a.asset_type);
    expect(ASSET_TYPES).toEqual(expect.arrayContaining([...new Set(types)]));
  });

  it("only use known operational modes", () => {
    const modes = [...assets, ...records].map((a) => a.operational_mode);
    expect(OPERATIONAL_MODES).toEqual(expect.arrayContaining([...new Set(modes)]));
  });

  it("only use known asset statuses", () => {
    const statuses = [...assets, ...records].map((a) => a.asset_status);
    expect(ASSET_STATUSES).toEqual(expect.arrayContaining([...new Set(statuses)]));
  });

  it("have a summary entry for every asset type", () => {
    expect(Object.keys(summary.by_asset_type).sort()).toEqual(["all", ...ASSET_TYPES].sort());
  });
});
