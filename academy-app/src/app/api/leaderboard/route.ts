import { NextResponse } from "next/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import { OnchainAcademy } from "~/types/onchain_academy";
import IDL from "~/types/idl/onchain_academy.json";
import { getConfigPda } from "~/lib/derive-pda";
import { userService } from "~/services/user.service";
import type { LeaderboardUser } from "~/lib/dummy-data";
import { levelingService } from "~/services/leveling.service";

const RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || process.env.NEXT_PULIC_DEVNET_URL || "https://api.devnet.solana.com";

const connection = new Connection(RPC_URL);
const provider = new anchor.AnchorProvider(connection, {} as any, { commitment: "confirmed" });
const program = new anchor.Program(IDL as any, provider) as anchor.Program<OnchainAcademy>;

export async function GET(req: Request) {
   try {
      const { searchParams } = new URL(req.url);
      const period = searchParams.get("period") as "weekly" | "monthly" | "all-time" || "all-time";
      const courseId = searchParams.get("course") || "all";

      const users = await userService.getAllUsers();
      const history = await userService.getAllXpHistory();

      let rankedUsers: LeaderboardUser[] = [];

      // HELIUS / ON-CHAIN ALL-TIME ALGORITHM (No Course Filter)
      if (period === "all-time" && courseId === "all") {
         try {
            const configPda = getConfigPda();
            const config = await program.account.config.fetch(configPda);
            const xpMintPubkey = config.xpMint;

            const largest = await connection.getTokenLargestAccounts(xpMintPubkey);

            for (const account of largest.value) {
               if (Number(account.amount) === 0) continue;

               // Fetch parsed account data to find the owner of this ATA
               const parsedInfo = await connection.getParsedAccountInfo(account.address);
               if (parsedInfo.value && "parsed" in parsedInfo.value.data) {
                  const owner = parsedInfo.value.data.parsed.info.owner;

                  // Match owner to a DB profile
                  const profile = await userService.getUserByWallet(owner);

                  const xp = Number(account.amount);
                  const level = levelingService.calculateLevel(xp);

                  rankedUsers.push({
                     rank: 0,
                     username: owner,
                     name: profile?.name || "Anonymous Learner",
                     avatar: profile?.avatar || "👻",
                     courses: [],
                     badge: "",
                     xp,
                     level,
                     streak: profile?.streak || 0
                  });
               }
            }
         } catch (error) {
            console.error("Failed to fetch on-chain largest accounts:", error);
         }
      }

      // BACKEND LEDGER ALGORITHM (Fallback or explicitly for time/course filtered calls)
      if (rankedUsers.length === 0) {
         let filteredHistory = history;

         if (period === "weekly") {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            filteredHistory = filteredHistory.filter((h: any) => new Date(h.timestamp) >= oneWeekAgo);
         } else if (period === "monthly") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            filteredHistory = filteredHistory.filter((h: any) => new Date(h.timestamp) >= oneMonthAgo);
         }

         if (courseId !== "all") {
            filteredHistory = filteredHistory.filter((h: any) => h.courseId === courseId);
         }

         const xpTotals: Record<string, number> = {};
         for (const record of filteredHistory) {
            const key = record.wallet || record.userId;
            xpTotals[key] = (xpTotals[key] || 0) + record.xpAmount;
         }

         for (const [key, total] of Object.entries(xpTotals)) {
            if (total <= 0) continue;

            let profile = users.find((u: any) => u.publicKey === key || u.id === key);

            rankedUsers.push({
               rank: 0,
               username: profile?.publicKey || key,
               name: profile?.name || "Anonymous Learner",
               avatar: profile?.avatar || "👻",
               courses: [],
               badge: "",
               xp: total,
               level: levelingService.calculateLevel(total),
               streak: profile?.streak || 0
            });
         }
      }

      rankedUsers.sort((a, b) => b.xp - a.xp);
      rankedUsers = rankedUsers.map((u, i) => ({ ...u, filteredRank: i + 1 }));

      return NextResponse.json({ leaderboard: rankedUsers });

   } catch (error: any) {
      console.error("[Leaderboard API Error]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
   }
}
