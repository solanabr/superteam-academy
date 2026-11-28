import { labRpcUrl } from "@/lib/solana/lab";
import { networkFromRpcUrl } from "@/lib/solana/network";

/**
 * Whether a learner may deploy a program from inside a lesson (the lab).
 *
 * The lab has its own RPC (`NEXT_PUBLIC_LAB_RPC_URL` in the browser,
 * `LAB_RPC_URL` on the server), which must be a devnet endpoint. The lab is on
 * only when `NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED` is `"true"` and no lab RPC
 * names mainnet. The app's own RPC and network label play no part: the Academy
 * program can run on mainnet while the lab stays on devnet. A lab RPC whose
 * host names no cluster passes here and is settled by the genesis hash check
 * (`lib/solana/lab-guard.ts` in the browser, `/api/deploy/save` on the server).
 */

/** Why the in-lesson deploy is off. */
export type LearnerDeployBlock = "mainnet" | "disabled";

export interface LearnerDeployInputs {
  flag: string | undefined;
  /** Every lab RPC the deploy path touches; any host naming mainnet counts. */
  labRpcUrls: readonly (string | undefined)[];
}

/** The reason the deploy is off, or `null` when it is on. Mainnet wins. */
export function learnerDeployBlock({
  flag,
  labRpcUrls,
}: LearnerDeployInputs): LearnerDeployBlock | null {
  const mainnet = labRpcUrls.some(
    (url) => !!url && networkFromRpcUrl(url) === "mainnet"
  );
  if (mainnet) return "mainnet";
  if (flag?.trim().toLowerCase() !== "true") return "disabled";
  return null;
}

/**
 * {@link learnerDeployBlock} from the app's env. Pass the server lab RPC on
 * the server; the browser lab RPC is always included.
 */
export function learnerDeployBlockFromEnv(
  serverLabRpcUrl?: string
): LearnerDeployBlock | null {
  return learnerDeployBlock({
    flag: process.env.NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED,
    labRpcUrls: [labRpcUrl(), serverLabRpcUrl],
  });
}

export function isLearnerDeployEnabled(): boolean {
  return learnerDeployBlockFromEnv() === null;
}

/** Client-facing refusal from `/api/deploy/save`. */
export const LEARNER_DEPLOY_DISABLED_ERROR =
  "Deploying from the lesson is turned off on this network.";
