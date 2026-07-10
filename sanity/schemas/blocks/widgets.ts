import { defineField, defineType } from "sanity";
import { capabilityFields } from "./_shared";

/**
 * Amendment A: each widget is its own block type, so the `_type` IS the
 * renderer-registry key. Mirrors content-schema WalletFundingBlock /
 * ProgramExplorerBlock / DeployedProgramCardBlock.
 */

export const walletFundingBlock = defineType({
  name: "wallet-funding",
  title: "Wallet Funding",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "amount",
      title: "SOL amount",
      type: "number",
      initialValue: 2,
      description: "Hardcoded to 2 in wallet-funding-card.tsx today.",
      validation: (r) => r.positive().max(5),
    }),
    defineField({
      name: "network",
      title: "Network",
      type: "string",
      initialValue: "devnet",
      options: { list: [{ title: "Devnet", value: "devnet" }] },
      validation: (r) => r.required(),
    }),
  ],
  preview: { prepare: () => ({ title: "Wallet Funding" }) },
});

export const programExplorerBlock = defineType({
  name: "program-explorer",
  title: "Program Explorer",
  type: "object",
  fields: [
    ...capabilityFields,
    defineField({
      name: "idl",
      title: "Program IDL (JSON)",
      type: "text",
      rows: 20,
      description:
        "Mirrors ProgramExplorerBlock.idl (a .json path); CS-9 resolves it to the IDL JSON string. Must contain a non-empty `instructions` array and `metadata.name` (the keypair-storage key generic-program-explorer.tsx looks for).",
      validation: (r) =>
        r.required().custom((value) => {
          if (typeof value !== "string") return "IDL is required";
          try {
            const parsed = JSON.parse(value) as {
              instructions?: unknown;
              metadata?: { name?: unknown };
            };
            if (
              !Array.isArray(parsed.instructions) ||
              parsed.instructions.length === 0
            ) {
              return "IDL must contain a non-empty 'instructions' array";
            }
            if (!parsed.metadata?.name)
              return "IDL must contain 'metadata.name'";
            return true;
          } catch {
            return "Invalid JSON";
          }
        }),
    }),
  ],
  preview: { prepare: () => ({ title: "Program Explorer" }) },
});

export const deployedProgramCardBlock = defineType({
  name: "deployed-program-card",
  title: "Deployed Program Card",
  type: "object",
  fields: [...capabilityFields],
  preview: { prepare: () => ({ title: "Deployed Program Card" }) },
});
