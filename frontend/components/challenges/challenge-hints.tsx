"use client";

import { useState } from "react";
import { Lightbulb, Eye, EyeOff, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Lightbulb className="h-5 w-5" />
					{t("hints.title")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between text-sm">
					<span>
						{t("hints.available")}: {revealedCount} / {totalHints}
					</span>
					<div className="flex items-center gap-2">
						<Coins className="h-4 w-4 text-yellow-500" />
						<span>
							{t("hints.totalCost")}: {totalCost} XP
						</span>
					</div>
				</div>

				<div className="space-y-3">
					{hints.map((hint, index) => {
						const isRevealed = revealedHints.has(index);
						const canAfford = userXP >= hint.cost;

						return (
							<div
								key={index}
								className={`border rounded-lg p-4 ${
									isRevealed
										? "bg-muted/50 border-muted"
										: "border-dashed border-muted-foreground/30"
								}`}
							>
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<Badge variant="outline" className="text-xs">
											{t("hints.hint")} {index + 1}
										</Badge>
										<div className="flex items-center gap-1 text-xs text-muted-foreground">
											<Coins className="h-3 w-3" />
											{hint.cost} XP
										</div>
									</div>

									{!isRevealed && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => handleUseHint(index)}
											disabled={!canAfford}
											className="gap-2"
										>
											{canAfford ? (
												<>
													<Eye className="h-3 w-3" />
													{t("hints.reveal")}
												</>
											) : (
												<>
													<EyeOff className="h-3 w-3" />
													{t("hints.insufficientXP")}
												</>
											)}
										</Button>
									)}
								</div>

								{isRevealed ? (
									<p className="text-sm leading-relaxed">{hint.content}</p>
								) : (
									<div className="flex items-center gap-2 text-muted-foreground">
										<EyeOff className="h-4 w-4" />
										<p className="text-sm">{t("hints.clickToReveal")}</p>
									</div>
								)}
							</div>
						);
					})}
				</div>

				<div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<h4 className="font-medium text-sm mb-2 flex items-center gap-2">
						<Lightbulb className="h-4 w-4 text-blue-500" />
						{t("hints.strategy")}
					</h4>
					<div className="space-y-1 text-xs text-muted-foreground">
						<p>• {t("hints.strategy1")}</p>
						<p>• {t("hints.strategy2")}</p>
						<p>• {t("hints.strategy3")}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
