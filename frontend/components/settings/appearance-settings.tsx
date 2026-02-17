"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

type ThemeVal = "light" | "dark" | "system";

const THEMES = [
	{ value: "light" as const, label: "Light", Icon: Sun },
	{ value: "dark" as const, label: "Dark", Icon: Moon },
	{ value: "system" as const, label: "System", Icon: Monitor },
];

const FONT_SIZES = [
	{ value: "small", label: "Small" },
	{ value: "medium", label: "Medium" },
	{ value: "large", label: "Large" },
];

export function AppearanceSettings() {
	const { toast } = useToast();
	const { theme, setTheme } = useTheme();
	const [isLoading, setIsLoading] = useState(false);
	const [currentTheme, setCurrentTheme] = useState<ThemeVal>((theme as ThemeVal) || "system");
	const [fontSize, setFontSize] = useState("medium");
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		setCurrentTheme((theme as ThemeVal) || "system");
	}, [theme]);

	const handleSave = async () => {
		setIsLoading(true);
		try {
			setTheme(currentTheme);
			await new Promise((resolve) => setTimeout(resolve, 500));
			toast({
				title: "Appearance updated",
				description: "Your preferences have been saved.",
			});
		} catch {
			toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
			<div className="px-6 py-4 border-b border-border/40">
				<h3 className="font-semibold text-sm">Appearance</h3>
			</div>

			<div className="p-6 space-y-6">
				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Theme
					</h4>
					<div className="grid grid-cols-3 gap-2">
						{THEMES.map(({ value, label, Icon }) => (
							<button
								key={value}
								type="button"
								onClick={() => setCurrentTheme(value)}
								className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
									currentTheme === value
										? "border-primary bg-primary/5"
										: "border-border/60 hover:bg-muted/30"
								}`}
							>
								<Icon
									className={`h-5 w-5 ${currentTheme === value ? "text-primary" : "text-muted-foreground"}`}
								/>
								<span className="text-xs font-medium">{label}</span>
							</button>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Font size
					</h4>
					<div className="flex gap-2">
						{FONT_SIZES.map(({ value, label }) => (
							<button
								key={value}
								type="button"
								onClick={() => setFontSize(value)}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									fontSize === value
										? "bg-primary text-primary-foreground"
										: "bg-muted/50 text-muted-foreground hover:bg-muted"
								}`}
							>
								{label}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
						Accessibility
					</h4>
					<div className="flex items-center justify-between py-2">
						<div>
							<Label className="text-sm">Reduced motion</Label>
							<p className="text-xs text-muted-foreground">
								Minimize animations across the platform
							</p>
						</div>
						<Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
					</div>
				</div>

				<div className="flex justify-end pt-2">
					<Button onClick={handleSave} disabled={isLoading} size="sm">
						{isLoading ? "Saving..." : "Save changes"}
					</Button>
				</div>
			</div>
		</div>
	);
}
