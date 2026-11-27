import { describe, it, expect, vi } from "vitest";
import { verifyLabDevnet } from "../lab-guard";
import { DEVNET_GENESIS_HASH, MAINNET_GENESIS_HASH } from "../network";

const connectionAnswering = (hash: string) => ({
  getGenesisHash: vi.fn(async () => hash),
});

describe("verifyLabDevnet", () => {
  it("is true when the lab RPC answers with devnet's genesis hash", async () => {
    expect(
      await verifyLabDevnet(connectionAnswering(DEVNET_GENESIS_HASH))
    ).toBe(true);
  });

  it.each([
    ["mainnet's", MAINNET_GENESIS_HASH],
    ["an unknown", "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY"],
  ])("is false for %s genesis hash", async (_name, hash) => {
    expect(await verifyLabDevnet(connectionAnswering(hash))).toBe(false);
  });

  it("is false when the genesis hash cannot be read", async () => {
    const connection = {
      getGenesisHash: vi.fn(async (): Promise<string> => {
        throw new Error("rpc down");
      }),
    };
    expect(await verifyLabDevnet(connection)).toBe(false);
  });

  it("reads the genesis hash once per connection", async () => {
    const devnet = connectionAnswering(DEVNET_GENESIS_HASH);
    const [first, second] = await Promise.all([
      verifyLabDevnet(devnet),
      verifyLabDevnet(devnet),
    ]);
    expect(await verifyLabDevnet(devnet)).toBe(true);
    expect([first, second]).toEqual([true, true]);
    expect(devnet.getGenesisHash).toHaveBeenCalledTimes(1);

    const mainnet = connectionAnswering(MAINNET_GENESIS_HASH);
    await verifyLabDevnet(mainnet);
    expect(await verifyLabDevnet(mainnet)).toBe(false);
    expect(mainnet.getGenesisHash).toHaveBeenCalledTimes(1);
  });

  it("reads again after a failed read, so one RPC error is not final", async () => {
    const getGenesisHash = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("rpc down"))
      .mockResolvedValue(DEVNET_GENESIS_HASH);
    const connection = { getGenesisHash };
    expect(await verifyLabDevnet(connection)).toBe(false);
    expect(await verifyLabDevnet(connection)).toBe(true);
    expect(getGenesisHash).toHaveBeenCalledTimes(2);
  });
});
