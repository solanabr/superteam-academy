"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface Hint {
	content: string;
	cost: number;
}

interface ChallengeHintsProps {
	hints: Hint[];
	usedHints: number[];
	onUseHint: (hintIndex: number) => void;
	userXP?: number;
}

export function ChallengeHints({
	hints,
	usedHints = [],
	onUseHint,
	userXP = 1000,
}: ChallengeHintsProps) {
	const t = useTranslations("challenges");
	const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set(usedHints));

	const handleUseHint = (index: number) => {
		if (!revealedHints.has(index) && userXP >= hints[index].cost) {
			setRevealedHints((prev) => new Set([...prev, index]));
			onUseHint(index);
		}
	};

	const totalHints = hints.length;
	const revealedCount = revealedHints.size;
	const totalCost = hints
		.filter((_, index) => revealedHints.has(index))
		.reduce((sum, hint) => sum + hint.cost, 0);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>
					{revealedCount}/{totalHints} {t("hints.available")}
				</span>
				<span>
					{totalCost} XP {t("hints.totalCost")}
				</span>
			</div>

			<div className="space-y-2">
				{hints.map((hint, index) => {
					const isRevealed = revealedHints.has(index);
					const canAfford = userXP >= hint.cost;

					return (
						<div
							key={index}
							className={`border rounded-md px-3 py-2 ${
								isRevealed
									? "bg-muted/50 border-muted"
									: "border-dashed border-muted-foreground/30"
							}`}
						>
							<div className="flex items-center justify-between mb-1">
								<div className="flex items-center gap-2">
									<Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
										{t("hints.hint")} {index + 1}
									</Badge>
									<span className="text-[10px] text-muted-foreground">
										{hint.cost} XP
									</span>
								</div>

								{!isRevealed && (
									<Button
										size="sm"
										variant="ghost"
										onClick={() => handleUseHint(index)}
										disabled={!canAfford}
										className="h-6 text-[10px] px-2"
									>
										{canAfford ? t("hints.reveal") : t("hints.insufficientXP")}
									</Button>
								)}
							</div>

							{isRevealed ? (
								<p className="text-xs leading-relaxed">{hint.content}</p>
							) : (
								<p className="text-xs text-muted-foreground">
									{t("hints.clickToReveal")}
								</p>
							)}
						</div>
					);
				})}
			</div>

			<div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
				<h4 className="text-xs font-medium mb-1">{t("hints.strategy")}</h4>
				<div className="space-y-0.5 text-[11px] text-muted-foreground">
					<p>&bull; {t("hints.strategy1")}</p>
					<p>&bull; {t("hints.strategy2")}</p>
					<p>&bull; {t("hints.strategy3")}</p>
				</div>
			</div>
		</div>
	);
}
