"use client";

import dynamic from "next/dynamic";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const OnboardingFlow = dynamic(
	() => import("@/components/onboarding/onboarding-flow").then((m) => m.OnboardingFlow),
	{ ssr: false }
);

interface OnboardingModalProps {
	onCompleted?: () => void;
}

export function OnboardingModal({ onCompleted }: OnboardingModalProps) {
	return (
		<Dialog open>
			<DialogContent
				className="w-[calc(100vw-1.5rem)] max-w-4xl p-4 sm:p-6 [&>button]:hidden max-h-[92vh] overflow-hidden"
				onEscapeKeyDown={(event) => event.preventDefault()}
				onPointerDownOutside={(event) => event.preventDefault()}
				onInteractOutside={(event) => event.preventDefault()}
			>
				<OnboardingFlow onCompleted={onCompleted} />
			</DialogContent>
		</Dialog>
	);
}
