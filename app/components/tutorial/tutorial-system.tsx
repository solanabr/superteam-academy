"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";

interface TutorialStep {
	id: string;
	title: string;
	content: string;
	target?: string; // CSS selector for highlighting
	position: "top" | "bottom" | "left" | "right" | "center";
	action?: {
		label: string;
		onClick: () => void;
	};
}

interface TutorialSystemProps {
	tutorialId: string;
	steps: TutorialStep[];
	onComplete?: () => void;
	onSkip?: () => void;
	autoStart?: boolean;
}

export function TutorialSystem({
	tutorialId,
	steps,
	onComplete,
	onSkip,
	autoStart = false,
}: TutorialSystemProps) {
	const t = useTranslations("tutorial");
	const { toast } = useToast();
	const [isActive, setIsActive] = useState(autoStart);
	const [currentStep, setCurrentStep] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const overlayRef = useRef<HTMLDivElement>(null);

	const highlightElement = useCallback((selector: string) => {
		const element = document.querySelector(selector);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "center" });
			element.classList.add("tutorial-highlight");
		}
	}, []);

	useEffect(() => {
		if (isActive && steps[currentStep]?.target) {
			highlightElement(steps[currentStep].target);
		}
	}, [isActive, currentStep, steps, highlightElement]);

	const clearHighlight = () => {
		document.querySelectorAll(".tutorial-highlight").forEach((el) => {
			el.classList.remove("tutorial-highlight");
		});
	};

	const handleNext = () => {
		clearHighlight();
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			handleComplete();
		}
	};

	const handlePrevious = () => {
		clearHighlight();
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleComplete = () => {
		setIsActive(false);
		clearHighlight();
		localStorage.setItem(`tutorial-${tutorialId}-completed`, "true");
		onComplete?.();
		toast({
			title: t("tutorialCompleted"),
			description: t("tutorialCompletedDesc"),
		});
	};

	const handleSkip = () => {
		setIsActive(false);
		clearHighlight();
		onSkip?.();
	};

	const togglePause = () => {
		setIsPaused(!isPaused);
	};

	if (!isActive) return null;

	const step = steps[currentStep];
	const progress = ((currentStep + 1) / steps.length) * 100;

	return (
		<div
			ref={overlayRef}
			className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
			onClick={(e) => {
				if (e.target === overlayRef.current) {
					handleSkip();
				}
			}}
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					handleSkip();
				}
			}}
		>
			<div className="absolute inset-0 tutorial-overlay" />

			<Card
				className="absolute z-10 max-w-md tutorial-tooltip"
				style={getTooltipPosition(step.position)}
			>
				<CardContent className="p-4">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<HelpCircle className="h-5 w-5 text-blue-600" />
								<span className="text-sm font-medium">
									{currentStep + 1} / {steps.length}
								</span>
							</div>
							<div className="flex items-center gap-1">
								<Button variant="ghost" size="sm" onClick={togglePause}>
									{isPaused ? (
										<Play className="h-4 w-4" />
									) : (
										<Pause className="h-4 w-4" />
									)}
								</Button>
								<Button variant="ghost" size="sm" onClick={handleSkip}>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<Progress value={progress} className="h-2" />

						<div className="space-y-2">
							<h3 className="font-semibold">{step.title}</h3>
							<p className="text-sm text-muted-foreground">{step.content}</p>
						</div>

						{step.action && (
							<Button
								onClick={() => {
									step.action?.onClick();
									handleNext();
								}}
								className="w-full"
							>
								{step.action.label}
							</Button>
						)}

						<div className="flex justify-between">
							<Button
								variant="outline"
								onClick={handlePrevious}
								disabled={currentStep === 0}
								size="sm"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								{t("previous")}
							</Button>
							<Button onClick={handleNext} size="sm">
								{currentStep === steps.length - 1 ? t("finish") : t("next")}
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function getTooltipPosition(position: string) {
	switch (position) {
		case "top":
			return { bottom: "100%", left: "50%", transform: "translateX(-50%)" };
		case "bottom":
			return { top: "100%", left: "50%", transform: "translateX(-50%)" };
		case "left":
			return { right: "100%", top: "50%", transform: "translateY(-50%)" };
		case "right":
			return { left: "100%", top: "50%", transform: "translateY(-50%)" };
		default:
			return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
	}
}

// Hook for managing tutorials
export function useTutorial() {
	const startTutorial = (tutorialId: string, _steps: TutorialStep[]) => {
		const completed = localStorage.getItem(`tutorial-${tutorialId}-completed`);
		if (!completed) {
			// Tutorial system will be triggered by parent component
			return true;
		}
		return false;
	};

	const resetTutorial = (tutorialId: string) => {
		localStorage.removeItem(`tutorial-${tutorialId}-completed`);
	};

	const isTutorialCompleted = (tutorialId: string) => {
		return localStorage.getItem(`tutorial-${tutorialId}-completed`) === "true";
	};

	return {
		startTutorial,
		resetTutorial,
		isTutorialCompleted,
	};
}

// Tutorial trigger component
interface TutorialTriggerProps {
	tutorialId: string;
	steps: TutorialStep[];
	children: React.ReactNode;
	className?: string;
}

export function TutorialTrigger({ tutorialId, steps, children, className }: TutorialTriggerProps) {
	const [showTutorial, setShowTutorial] = useState(false);

	const handleStartTutorial = () => {
		setShowTutorial(true);
	};

	return (
		<>
			<button type="button" className={className} onClick={handleStartTutorial}>
				{children}
			</button>

			{showTutorial && (
				<TutorialSystem
					tutorialId={tutorialId}
					steps={steps}
					onComplete={() => setShowTutorial(false)}
					onSkip={() => setShowTutorial(false)}
				/>
			)}
		</>
	);
}
