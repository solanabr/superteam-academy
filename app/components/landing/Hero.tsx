/**
 * @fileoverview Hero section for the landing page.
 * Displays the primary value proposition, CTAs, and a typing code animation.
 */
"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { DotGrid } from "@/components/shared/DotGrid";
import { TypingAnimation } from "@/components/shared/TypingAnimation";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

// Hero Section
// Displays the primary value proposition with a large typographic title,
// description, and call-to-action buttons.
// Also includes a technical typing animation of a Solana program.
export function Hero() {
	const t = useTranslations("Hero");

	const handleExploreClick = () => {
		posthog.capture("hero_explore_clicked");
		sendGAEvent("event", "hero_cta_click", { type: "explore" });
	};

	const handleDiscordClick = () => {
		posthog.capture("hero_discord_clicked");
		sendGAEvent("event", "hero_cta_click", { type: "discord" });
	};

	return (
		<header className="px-6 lg:px-12 py-16 lg:py-[120px] border-b border-ink-secondary/20 dark:border-border grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 relative overflow-hidden">
			{/* Dot Grid Background */}
			<DotGrid />

			<div className="flex flex-col justify-center relative z-10">
				{/* Entrance Badge */}
				<span className="bg-ink-primary text-bg-base inline-block px-3 py-1 mb-4 self-start text-[11px] uppercase tracking-widest">
					{t("badge")}
				</span>

				{/* Main Title */}
				<h1 className="font-display font-bold leading-[0.9] -tracking-[0.02em] text-[60px] lg:text-[120px] mb-6 whitespace-pre-line">
					{t("title")}
				</h1>

				<p className="text-base lg:text-[18px] text-ink-secondary max-w-[500px] mb-10">
					{t("description")}
				</p>

				<div className="flex flex-col sm:flex-row gap-4">
					<div className="w-full sm:w-auto">
						<Button
							asChild
							variant="landingPrimary"
							onClick={handleExploreClick}
							className="rounded-none uppercase text-xs font-bold px-8 py-4 h-auto font-mono gap-3 w-full sm:w-auto justify-center"
						>
							<Link href="/courses">
								{t("explore")} <ArrowRightIcon size={16} weight="duotone" />
							</Link>
						</Button>
					</div>

					<div className="w-full sm:w-auto">
						<Button
							asChild
							variant="landingSecondary"
							onClick={handleDiscordClick}
							className="rounded-none uppercase text-xs font-bold px-8 py-4 h-auto font-mono gap-3 w-full sm:w-auto justify-center"
						>
							<Link
								href="https://discord.gg/superteam"
								target="_blank"
								rel="noopener noreferrer"
							>
								{t("discord")}
							</Link>
						</Button>
					</div>
				</div>
			</div>

			<div className="hidden lg:flex relative z-10 border border-ink-secondary/20 dark:border-border bg-[rgba(13,20,18,0.02)] items-center justify-center p-4 lg:p-8 min-h-[300px] lg:min-h-[400px]">
				{/* Corner Accents */}
				{[
					{ top: "-10px", left: "-10px" },
					{ top: "-10px", right: "-10px" },
					{ bottom: "-10px", left: "-10px" },
					{ bottom: "-10px", right: "-10px" },
				].map((pos, i) => (
					<div
						key={i}
						className="absolute w-5 h-5 border border-ink-primary bg-bg-base"
						style={pos}
					/>
				))}

				<TypingAnimation
					text={`pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;
    
    if account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Academy protocol initialized...");
    Ok(())
}`}
					speed={15}
					className="text-[9px] lg:text-[10px] whitespace-pre font-mono overflow-x-auto max-w-full"
					syntaxHighlight={true}
				/>
			</div>
		</header>
	);
}
