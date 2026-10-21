import { isMainnetLabel, networkFromRpcUrl } from "@/lib/solana/network";

/**
 * Whether a learner may deploy a program from inside a lesson.
 *
 * The deploy panel signs with the learner's wallet through the app's own RPC,
 * so on mainnet it would spend real SOL. It is off there whatever the flag
 * says, and elsewhere it is on only when `NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED`
 * is `"true"`. Client and server read the same build-time values, so the
 * lesson and `/api/deploy/save` agree.
 */

/** Why the in-lesson deploy is off. */
export type LearnerDeployBlock = "mainnet" | "disabled";

export interface LearnerDeployInputs {
  flag: string | undefined;
  networkLabel: string | undefined;
  /** Every RPC the deploy path touches; any host naming mainnet counts. */
  rpcUrls: readonly (string | undefined)[];
}

/** The reason the deploy is off, or `null` when it is on. Mainnet wins. */
export function learnerDeployBlock({
  flag,
  networkLabel,
  rpcUrls,
}: LearnerDeployInputs): LearnerDeployBlock | null {
  const mainnet =
    isMainnetLabel(networkLabel) ||
    rpcUrls.some((url) => !!url && networkFromRpcUrl(url) === "mainnet");
  if (mainnet) return "mainnet";
  if (flag?.trim().toLowerCase() !== "true") return "disabled";
  return null;
}

/**
 * {@link learnerDeployBlock} from the app's env. Pass the server RPC on the
 * server; the browser RPC is always included.
 */
export function learnerDeployBlockFromEnv(
  serverRpcUrl?: string
): LearnerDeployBlock | null {
  return learnerDeployBlock({
    flag: process.env.NEXT_PUBLIC_LEARNER_DEPLOY_ENABLED,
    networkLabel: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    rpcUrls: [process.env.NEXT_PUBLIC_SOLANA_RPC_URL, serverRpcUrl],
  });
}

export function isLearnerDeployEnabled(): boolean {
  return learnerDeployBlockFromEnv() === null;
}

/** Client-facing refusal from `/api/deploy/save`. */
export const LEARNER_DEPLOY_DISABLED_ERROR =
  "Deploying from the lesson is turned off on this network.";
