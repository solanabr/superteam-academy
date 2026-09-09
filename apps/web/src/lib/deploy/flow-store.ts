/**
 * One deploy-flow state, read by two subtrees.
 *
 * The stepper renders both above the deploy panel and inside the editor
 * toolbar, and those are siblings under the lesson page — a context provider
 * would mean threading state through `lesson-client` and every block renderer.
 * A module store keeps the two mirrors in sync without touching the block
 * plumbing, and stays agnostic about WHO produces each fact (the deploy panel
 * publishes funding and deploy; the editor publishes build and submit).
 */

import { EMPTY_DEPLOY_FLOW, type DeployFlowState } from "./steps";

let state: DeployFlowState = EMPTY_DEPLOY_FLOW;
const listeners = new Set<() => void>();

export function getDeployFlow(): DeployFlowState {
  return state;
}

export function subscribeDeployFlow(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** No-ops when nothing actually changed, so `useSyncExternalStore` stays quiet. */
export function setDeployFlow(patch: Partial<DeployFlowState>): void {
  const next = { ...state, ...patch };
  const changed = (Object.keys(next) as (keyof DeployFlowState)[]).some(
    (k) => next[k] !== state[k]
  );
  if (!changed) return;
  state = next;
  listeners.forEach((l) => l());
}

/** Leaving the lesson must not carry one deploy's progress into the next. */
export function resetDeployFlow(): void {
  setDeployFlow(EMPTY_DEPLOY_FLOW);
}
