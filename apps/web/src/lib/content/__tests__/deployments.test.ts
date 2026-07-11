import { describe, it, expect, vi } from "vitest";
import {
  isSynced,
  toDeploymentMap,
  type DeploymentStatus,
} from "../deployments";

vi.mock("server-only", () => ({}));

function row(over: Partial<DeploymentStatus>): DeploymentStatus {
  return {
    content_id: "course-x",
    kind: "course",
    status: "synced",
    is_active: true,
    achievement_pda: null,
    ...over,
  };
}

describe("isSynced — the entire public-visibility gate", () => {
  it("synced + active → visible", () => {
    expect(isSynced(row({ status: "synced", is_active: true }))).toBe(true);
  });

  it("synced + inactive → hidden", () => {
    expect(isSynced(row({ status: "synced", is_active: false }))).toBe(false);
  });

  it("synced + is_active null → visible (coalesce to true)", () => {
    expect(isSynced(row({ status: "synced", is_active: null }))).toBe(true);
  });

  it("not synced (pending/failed/null) → hidden regardless of active", () => {
    expect(isSynced(row({ status: "pending", is_active: true }))).toBe(false);
    expect(isSynced(row({ status: "failed", is_active: true }))).toBe(false);
    expect(isSynced(row({ status: null, is_active: true }))).toBe(false);
  });

  it("missing deployment (undefined) → hidden (fail-closed)", () => {
    expect(isSynced(undefined)).toBe(false);
  });
});

describe("toDeploymentMap — shaping the flat rows", () => {
  it("keys each row by content_id", () => {
    const rows = [
      row({ content_id: "course-a" }),
      row({ content_id: "course-b", status: "pending" }),
      row({ content_id: "achievement-x", kind: "achievement" }),
    ];
    const map = toDeploymentMap(rows);
    expect(map.size).toBe(3);
    expect(map.get("course-a")?.status).toBe("synced");
    expect(map.get("achievement-x")?.kind).toBe("achievement");
    expect(map.get("nope")).toBeUndefined();
  });

  it("composes with isSynced to gate a mixed catalog", () => {
    const map = toDeploymentMap([
      row({ content_id: "course-live", status: "synced", is_active: true }),
      row({ content_id: "course-off", status: "synced", is_active: false }),
      row({ content_id: "course-pending", status: "pending" }),
    ]);
    expect(isSynced(map.get("course-live"))).toBe(true);
    expect(isSynced(map.get("course-off"))).toBe(false);
    expect(isSynced(map.get("course-pending"))).toBe(false);
    expect(isSynced(map.get("course-unknown"))).toBe(false);
  });

  it("last write wins on duplicate content_id", () => {
    const map = toDeploymentMap([
      row({ content_id: "dup", status: "pending" }),
      row({ content_id: "dup", status: "synced" }),
    ]);
    expect(map.get("dup")?.status).toBe("synced");
  });
});
