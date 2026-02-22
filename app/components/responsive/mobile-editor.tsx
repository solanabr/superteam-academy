import { useState, useEffect, useRef } from "react";
import { Smartphone, Monitor, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MobileEditorProps {
	code: string;
	onCodeChange: (code: string) => void;
	language?: string;
	readOnly?: boolean;
	className?: string;
}

export function MobileEditor({
	code,
	onCodeChange,
	language: _language = "typescript",
	readOnly = false,
	className,
}: MobileEditorProps) {
	const t = useTranslations("editor");
	const { toast } = useToast();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showLineNumbers, setShowLineNumbers] = useState(true);
	const [fontSize, setFontSize] = useState(14);
	const [isMobileOptimized, setIsMobileOptimized] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			const isMobile = window.innerWidth < 768;
			setIsMobileOptimized(isMobile);
			if (isMobile && !isFullscreen) {
				setFontSize(16); // Larger font for mobile readability
			}
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, [isFullscreen]);

	const handleFullscreenToggle = () => {
		setIsFullscreen(!isFullscreen);
		if (!isFullscreen) {
			toast({
				title: t("fullscreenMode"),
				description: t("fullscreenDescription"),
			});
		}
	};

	const handleFontSizeChange = (delta: number) => {
		const newSize = Math.max(12, Math.min(24, fontSize + delta));
		setFontSize(newSize);
	};

	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText(code);
			toast({
				title: t("codeCopied"),
				description: t("codeCopiedDescription"),
			});
		} catch (_error) {
			toast({
				title: t("copyFailed"),
				description: t("copyFailedDescription"),
				variant: "destructive",
			});
		}
	};

	const handlePasteCode = async () => {
		try {
			const clipboardText = await navigator.clipboard.readText();
			onCodeChange(clipboardText);
			toast({
				title: t("codePasted"),
				description: t("codePastedDescription"),
			});
		} catch (_error) {
			toast({
				title: t("pasteFailed"),
				description: t("pasteFailedDescription"),
				variant: "destructive",
			});
		}
	};

	const insertText = (text: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const newCode = code.substring(0, start) + text + code.substring(end);

		onCodeChange(newCode);

		// Set cursor position after inserted text
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(start + text.length, start + text.length);
		}, 0);
	};

	const getLineNumbers = () => {
		const lines = code.split("\n");
		return lines.map((_, index) => (
			<div
				key={index}
				className="text-right pr-2 text-muted-foreground text-sm leading-6 select-none"
				style={{ fontSize: `${fontSize}px` }}
			>
				{index + 1}
			</div>
		));
	};

	return (
		<Card className={cn("relative", isFullscreen && "fixed inset-4 z-50", className)}>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Monitor className="h-5 w-5" />
						{t("codeEditor")}
						{isMobileOptimized && (
							<Badge variant="secondary" className="text-xs">
								<Smartphone className="h-3 w-3 mr-1" />
								{t("mobileOptimized")}
							</Badge>
						)}
					</CardTitle>
					<div className="flex items-center gap-2">
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleFontSizeChange(-1)}
								disabled={fontSize <= 12}
								className="h-8 w-8 p-0"
							>
								<span className="text-lg leading-none">-</span>
							</Button>
							<span className="text-sm text-muted-foreground min-w-8 text-center">
								{fontSize}px
							</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => handleFontSizeChange(1)}
								disabled={fontSize >= 24}
								className="h-8 w-8 p-0"
							>
								<span className="text-lg leading-none">+</span>
							</Button>
						</div>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowLineNumbers(!showLineNumbers)}
							className="h-8 w-8 p-0"
						>
							{showLineNumbers ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={handleFullscreenToggle}
							className="h-8 w-8 p-0"
						>
							{isFullscreen ? (
								<Monitor className="h-4 w-4" />
							) : (
								<Smartphone className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>

				{isMobileOptimized && (
					<div className="flex flex-wrap gap-2 mt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => insertText("console.log(")}
							className="text-xs"
						>
							console.log
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => insertText("function ")}
							className="text-xs"
						>
							function
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => insertText("const ")}
							className="text-xs"
						>
							const
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopyCode}
							className="text-xs"
						>
							{t("copy")}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handlePasteCode}
							className="text-xs"
						>
							{t("paste")}
						</Button>
					</div>
				)}
			</CardHeader>

			<CardContent className="p-0">
				<div className="relative">
					<div className="flex">
						{showLineNumbers && (
							<div className="bg-muted/50 border-r px-1 py-3 min-w-[3rem]">
								{getLineNumbers()}
							</div>
						)}

						<textarea
							ref={textareaRef}
							value={code}
							onChange={(e) => onCodeChange(e.target.value)}
							readOnly={readOnly}
							className={cn(
								"flex-1 p-3 font-mono border-0 resize-none focus:outline-none bg-background",
								"min-h-[200px] md:min-h-[300px]",
								isFullscreen && "min-h-[400px]",
								readOnly && "bg-muted/20"
							)}
							style={{
								fontSize: `${fontSize}px`,
								lineHeight: "1.5",
								tabSize: 2,
							}}
							placeholder={t("enterCode")}
							spellCheck={false}
							autoComplete="off"
							autoCorrect="off"
							autoCapitalize="off"
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
