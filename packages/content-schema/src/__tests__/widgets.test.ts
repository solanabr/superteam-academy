import { describe, it, expect } from "vitest";
import { OpenEndedBlock } from "../blocks/open-ended";
import {
  WalletFundingBlock,
  ProgramExplorerBlock,
  DeployedProgramCardBlock,
} from "../blocks/widgets";

describe("OpenEndedBlock", () => {
  it("accepts a reflection prompt", () => {
    const b = OpenEndedBlock.parse({
      type: "openEnded",
      key: "reflect",
      prompt: "What did you learn?",
      maxWords: 150,
    });
    expect(b.maxWords).toBe(150);
  });

  it("defaults maxWords", () => {
    const b = OpenEndedBlock.parse({
      type: "openEnded",
      key: "r",
      prompt: "p",
    });
    expect(b.maxWords).toBe(200);
  });

  it("caps maxWords so one AI reply stays cheap", () => {
    expect(
      OpenEndedBlock.safeParse({
        type: "openEnded",
        key: "r",
        prompt: "p",
        maxWords: 5000,
      }).success
    ).toBe(false);
  });
});

describe("WalletFundingBlock", () => {
  it("carries config that is hardcoded in the component today", () => {
    const b = WalletFundingBlock.parse({
      type: "wallet-funding",
      key: "fund",
      amount: 2,
      network: "devnet",
      produces: "funded-wallet",
    });
    expect(b.amount).toBe(2);
    expect(b.produces).toBe("funded-wallet");
  });

  it("rejects a mainnet airdrop", () => {
    expect(
      WalletFundingBlock.safeParse({
        type: "wallet-funding",
        key: "f",
        amount: 2,
        network: "mainnet-beta",
      }).success
    ).toBe(false);
  });
});

describe("ProgramExplorerBlock", () => {
  it("requires an idl file and consumes a deployed program", () => {
    const b = ProgramExplorerBlock.parse({
      type: "program-explorer",
      key: "explore",
      idl: "program.idl.json",
      consumes: ["deployed-program"],
    });
    expect(b.idl).toBe("program.idl.json");
  });

  it("rejects an inline idl string", () => {
    expect(
      ProgramExplorerBlock.safeParse({
        type: "program-explorer",
        key: "e",
        idl: '{"instructions":[]}',
      }).success
    ).toBe(false);
  });
});

describe("DeployedProgramCardBlock", () => {
  it("exists, unlike its predecessor", () => {
    const b = DeployedProgramCardBlock.parse({
      type: "deployed-program-card",
      key: "card",
      consumes: ["deployed-program"],
    });
    expect(b.consumes).toEqual(["deployed-program"]);
  });
});

describe("per-type produces constraints (gate 13a, local half)", () => {
  it("rejects wallet-funding producing anything but funded-wallet", () => {
    expect(
      WalletFundingBlock.safeParse({
        type: "wallet-funding",
        key: "f",
        produces: "deployed-program",
      }).success
    ).toBe(false);
  });

  it("rejects produces on pure consumers", () => {
    expect(
      ProgramExplorerBlock.safeParse({
        type: "program-explorer",
        key: "e",
        idl: "program.idl.json",
        produces: "funded-wallet",
      }).success
    ).toBe(false);
    expect(
      DeployedProgramCardBlock.safeParse({
        type: "deployed-program-card",
        key: "c",
        produces: "deployed-program",
      }).success
    ).toBe(false);
  });
});
