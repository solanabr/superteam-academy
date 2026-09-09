"use client";

import { useSyncExternalStore } from "react";
import { getDeployFlow, subscribeDeployFlow } from "@/lib/deploy/flow-store";
import { EMPTY_DEPLOY_FLOW, type DeployFlowState } from "@/lib/deploy/steps";

/** The shared deploy-flow state, for either stepper mirror. */
export function useDeployFlow(): DeployFlowState {
  return useSyncExternalStore(
    subscribeDeployFlow,
    getDeployFlow,
    () => EMPTY_DEPLOY_FLOW
  );
}
