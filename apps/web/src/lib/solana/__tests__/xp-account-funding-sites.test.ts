import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Every platform-signed XP transaction gets its token account from
// ensureXpTokenAccount, which funds at most once per wallet. A create built
// next to the XP instruction would fund again after every close, so none of
// the senders may build one.
const SENDERS = ["../academy-program.ts", "../xp-mint.ts"];

describe("XP token account funding sites", () => {
  it.each(SENDERS)("%s builds no token account create of its own", (file) => {
    const source = readFileSync(resolve(__dirname, file), "utf8");
    expect(source).not.toMatch(/createAssociatedTokenAccount/);
    expect(source).toMatch(/ensureXpTokenAccount\(/);
  });

  it("academy-program ensures every account its XP instructions write", () => {
    const source = readFileSync(
      resolve(__dirname, "../academy-program.ts"),
      "utf8"
    );
    // complete_lesson, finalize (learner and creator), award_achievement and
    // reward_xp.
    expect(source.match(/ensureXpTokenAccount\(/g)).toHaveLength(5);
  });
});
