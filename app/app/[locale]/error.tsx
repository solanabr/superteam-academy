"use client";

import { useEffect } from "react";
import { Link } from "@superteam-academy/i18n/navigation";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ErrorPageProps {
	error?: Error;
	reset?: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
	const t = useTranslations("common.error");

	useEffect(() => {
		if (process.env.NODE_ENV === "development" && error) {
			console.error("Error page rendered:", error);
		}
	}, [error]);

	const handleRetry = () => {
		if (reset) {
			reset();
		} else {
			window.location.reload();
		}
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<div className="max-w-md w-full text-center space-y-8">
				<div className="relative mx-auto w-24 h-24">
					<div className="absolute inset-0 rounded-full bg-destructive/10 animate-pulse" />
					<div className="absolute inset-0 flex items-center justify-center">
						<AlertTriangle className="h-10 w-10 text-destructive" />
					</div>
				</div>

				<div className="space-y-2">
					<h1 className="text-3xl font-bold font-display">{t("title")}</h1>
					<p className="text-muted-foreground">{t("description")}</p>
				</div>

				{process.env.NODE_ENV === "development" && error && (
					<div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-left">
						<p className="text-xs font-medium text-destructive mb-1">{t("details")}</p>
						<code className="text-xs text-destructive/80 break-all">
							{error.message}
						</code>
					</div>
				)}

				<div className="flex gap-3 justify-center">
					<Button onClick={handleRetry} size="sm">
						<RefreshCw className="h-4 w-4 mr-2" />
						{t("tryAgain")}
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href="/">
							<Home className="h-4 w-4 mr-2" />
							{t("goHome")}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
