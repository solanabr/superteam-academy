import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { BLOCK_REGISTRY, type BlockType } from "@superteam-lms/content-schema";
import { GATE_BLOCK_TYPES, isGateBlock } from "../gate-blocks";

/**
 * The server's completion gate (/api/lessons/complete) denies unless every
 * `graded` block passes and every `required` ungraded block is attested — so
 * the client's Mark Complete gate must cover exactly that union. #969's gate
 * review found the client hardcoding quiz/openEnded while the registry also
 * grades `parsons`; this pins both sides to BLOCK_REGISTRY so a future block
 * type cannot drift silently.
 */
describe("client completion gate ↔ BLOCK_REGISTRY", () => {
  it("gate set equals the registry's graded ∪ required set", () => {
    const registryGate = (Object.keys(BLOCK_REGISTRY) as BlockType[]).filter(
      (t) => BLOCK_REGISTRY[t].graded || BLOCK_REGISTRY[t].required
    );
    expect([...GATE_BLOCK_TYPES].sort()).toEqual(registryGate.sort());
  });

  it("gates parsons — the #970 disagreement", () => {
    expect(isGateBlock("parsons")).toBe(true);
  });

  it("keeps the pre-existing gate members and non-members", () => {
    expect(isGateBlock("quiz")).toBe(true);
    expect(isGateBlock("openEnded")).toBe(true);
    expect(isGateBlock("code")).toBe(true);
    expect(isGateBlock("prose")).toBe(false);
    expect(isGateBlock("video")).toBe(false);
    expect(isGateBlock("wallet-funding")).toBe(false);
  });

  it("lesson-client derives its gate from this module, not a type list", () => {
    const src = readFileSync(
      join(
        __dirname,
        "../../../app/[locale]/(platform)/courses/[slug]/lessons/[id]/lesson-client.tsx"
      ),
      "utf8"
    );
    expect(src).toContain('from "@/lib/lessons/gate-blocks"');
    expect(src).toContain("isGateBlock(b._type)");
  });
});
