/**
 * The four things a learner does in a deploy lesson, in order.
 *
 * The lesson used to give no answer to "I pressed Compilar, now what?": the
 * deploy card sat in the other column with nothing pointing at it. These steps
 * are rendered twice — above the deploy panel and as a strip in the editor
 * toolbar — from one derivation, so the two can never disagree.
 */

export type DeployStepKey = "build" | "fund" | "deploy" | "submit";

export type DeployStepStatus = "done" | "active" | "todo";

export interface DeployFlowState {
  /** A build succeeded (a buildUuid exists). */
  built: boolean;
  /** The signer holds at least the deploy estimate. */
  funded: boolean;
  /** The program is on devnet and its result is saved. */
  deployed: boolean;
  /** The lesson is complete. */
  submitted: boolean;
}

export const DEPLOY_FLOW_STEPS: readonly DeployStepKey[] = [
  "build",
  "fund",
  "deploy",
  "submit",
] as const;

export const EMPTY_DEPLOY_FLOW: DeployFlowState = {
  built: false,
  funded: false,
  deployed: false,
  submitted: false,
};

const FLAG_OF: Record<DeployStepKey, keyof DeployFlowState> = {
  build: "built",
  fund: "funded",
  deploy: "deployed",
  submit: "submitted",
};

export interface DerivedDeployStep {
  key: DeployStepKey;
  status: DeployStepStatus;
}

/**
 * A step is done when its own flag is set; the first step that is not done is
 * the active one. Nothing is active once every step is done.
 */
export function deriveDeploySteps(state: DeployFlowState): DerivedDeployStep[] {
  let activeAssigned = false;
  return DEPLOY_FLOW_STEPS.map((key) => {
    if (state[FLAG_OF[key]]) return { key, status: "done" as const };
    if (!activeAssigned) {
      activeAssigned = true;
      return { key, status: "active" as const };
    }
    return { key, status: "todo" as const };
  });
}
