import type { Metadata } from "next";
import { Link } from "@superteam-academy/i18n/navigation";
import { Calendar, Clock, MapPin, Users, ExternalLink, Video, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTranslations } from "next-intl/server";
import { getUpcomingEvents, getPastEvents, isSanityConfigured } from "@/lib/community-cms";

export const metadata: Metadata = {
	title: "Events | Community | Superteam Academy",
	description:
		"Attend workshops, AMAs, hackathons, and meetups with the Superteam Academy community.",
};

const UPCOMING_EVENTS = [
	{
		id: "1",
		title: "Solana Program Security Workshop",
		description:
			"Deep dive into common vulnerabilities, fuzzing strategies, and professional audit techniques. Bring your code for live review.",
		date: "Mar 5, 2026",
		time: "2:00 PM UTC",
		type: "Workshop",
		location: "online",
		attendees: 156,
		maxAttendees: 200,
		speakers: [
			{ name: "James Wu", role: "Security Auditor" },
			{ name: "Sarah Chen", role: "Program Engineer" },
		],
		tags: ["security", "auditing", "workshop"],
	},
	{
		id: "2",
		title: "DeFi Protocol Design AMA",
		description:
			"Ask anything about building DeFi protocols on Solana — AMM design, liquidity incentives, oracle integration, and risk management.",
		date: "Mar 10, 2026",
		time: "6:00 PM UTC",
		type: "AMA",
		location: "online",
		attendees: 89,
		maxAttendees: null,
		speakers: [{ name: "Alex Rivera", role: "DeFi Protocol Lead" }],
		tags: ["defi", "ama"],
	},
	{
		id: "3",
		title: "Weekend Hackathon: ZK Compression",
		description:
			"48-hour hackathon focused on ZK Compression and Light Protocol. Build something new, win prizes, and get mentorship from core contributors.",
		date: "Mar 15-16, 2026",
		time: "9:00 AM UTC",
		type: "Hackathon",
		location: "online",
		attendees: 234,
		maxAttendees: 500,
		speakers: [{ name: "Light Protocol Team", role: "Core Contributors" }],
		tags: ["hackathon", "zk", "competition"],
	},
	{
		id: "4",
		title: "Superteam Berlin Meetup",
		description:
			"In-person meetup in Berlin. Network with local Solana builders, share projects, and enjoy talks on the latest ecosystem developments.",
		date: "Mar 22, 2026",
		time: "7:00 PM CET",
		type: "Meetup",
		location: "Berlin, Germany",
		attendees: 42,
		maxAttendees: 80,
		speakers: [],
		tags: ["meetup", "networking", "berlin"],
	},
];

const PAST_EVENTS = [
	{
		id: "p1",
		title: "Anchor 0.31 Migration Workshop",
		date: "Feb 1, 2026",
		type: "Workshop",
		attendees: 210,
		recordingUrl: "#",
	},
	{
		id: "p2",
		title: "Token-2022 Deep Dive",
		date: "Jan 20, 2026",
		type: "Workshop",
		attendees: 180,
		recordingUrl: "#",
	},
	{
		id: "p3",
		title: "Metaplex Core NFTs AMA",
		date: "Jan 10, 2026",
		type: "AMA",
		attendees: 145,
		recordingUrl: "#",
	},
	{
		id: "p4",
		title: "Season 2 Hackathon: DeFi Track",
		date: "Dec 15-16, 2025",
		type: "Hackathon",
		attendees: 312,
		recordingUrl: "#",
	},
];

export default async function EventsPage() {
	const t = await getTranslations("community");

	// Fetch events from Sanity or use mock data
	const upcomingEvents = isSanityConfigured
		? (await getUpcomingEvents()).map(normalizeEvent)
		: UPCOMING_EVENTS;
	const pastEvents = isSanityConfigured
		? (await getPastEvents()).map(normalizePastEvent)
		: PAST_EVENTS;

	return (
		<div className="space-y-6">
			<Tabs defaultValue="upcoming" className="space-y-5">
				<div className="flex items-center justify-between">
					<TabsList className="bg-muted/50 p-1 rounded-xl">
						<TabsTrigger
							value="upcoming"
							className="rounded-lg text-sm data-[state=active]:shadow-sm"
						>
							{t("events.tabs.upcoming")}
						</TabsTrigger>
						<TabsTrigger
							value="past"
							className="rounded-lg text-sm data-[state=active]:shadow-sm"
						>
							{t("events.tabs.past")}
						</TabsTrigger>
					</TabsList>
					<Button size="sm" className="gap-1.5" asChild>
						<Link href="/community/events/new">
							<Plus className="h-3.5 w-3.5" />
							Create Event
						</Link>
					</Button>
				</div>

				<TabsContent value="upcoming" className="space-y-4">
					{upcomingEvents.map((event) => (
						<div
							key={event.id}
							className="rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/20 transition-colors"
						>
							<div className="flex flex-col sm:flex-row gap-5">
								<div className="shrink-0 flex sm:flex-col items-center gap-2 sm:gap-0 sm:w-16">
									<div className="h-14 w-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
										<span className="text-xs text-primary font-medium leading-none">
											{event.date.split(" ")[0]}
										</span>
										<span className="text-lg font-bold text-primary leading-tight">
											{event.date.split(" ")[1]?.replace(",", "")}
										</span>
									</div>
								</div>

								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1 flex-wrap">
										<Badge
											variant="outline"
											className="text-[10px] uppercase tracking-wider font-medium"
										>
											{event.type}
										</Badge>
										{event.location === "online" ? (
											<span className="flex items-center gap-1 text-xs text-muted-foreground">
												<Video className="h-3 w-3" />
												{t("events.online")}
											</span>
										) : (
											<span className="flex items-center gap-1 text-xs text-muted-foreground">
												<MapPin className="h-3 w-3" />
												{event.location}
											</span>
										)}
									</div>

									<h3 className="text-base font-semibold mb-1">{event.title}</h3>
									<p className="text-sm text-muted-foreground mb-3 line-clamp-2">
										{event.description}
									</p>

									<div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{event.time}
										</span>
										<span className="flex items-center gap-1">
											<Users className="h-3 w-3" />
											{event.attendees.toLocaleString()}
											{event.maxAttendees &&
												` / ${event.maxAttendees.toLocaleString()}`}{" "}
											{t("events.registered")}
										</span>
									</div>

									{event.speakers.length > 0 && (
										<div className="flex items-center gap-2 mt-3 flex-wrap">
											<span className="text-xs text-muted-foreground">
												{t("events.speakers")}:
											</span>
											{event.speakers.map((s) => (
												<Badge
													key={s.name}
													variant="secondary"
													className="text-xs font-normal"
												>
													{s.name}
												</Badge>
											))}
										</div>
									)}
								</div>

								<div className="shrink-0 flex sm:flex-col items-center gap-2">
									<Button size="sm" className="w-full sm:w-auto">
										{t("events.rsvp")}
									</Button>
								</div>
							</div>
						</div>
					))}
					{upcomingEvents.length === 0 && (
						<div className="text-center py-16 space-y-3">
							<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
								<Calendar className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold">{t("events.empty")}</h3>
							<p className="text-sm text-muted-foreground max-w-sm mx-auto">
								{t("events.emptyDescription")}
							</p>
						</div>
					)}
				</TabsContent>

				<TabsContent value="past" className="space-y-3">
					{pastEvents.map((event) => (
						<div
							key={event.id}
							className="rounded-2xl border border-border/60 bg-card px-5 py-4 flex items-center gap-4"
						>
							<div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
								<Calendar className="h-5 w-5 text-muted-foreground" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium truncate">{event.title}</p>
								<div className="flex items-center gap-2 mt-0.5">
									<span className="text-xs text-muted-foreground">
										{event.date}
									</span>
									<Badge
										variant="outline"
										className="text-[10px] uppercase tracking-wider font-medium"
									>
										{event.type}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{event.attendees.toLocaleString()} {t("events.attended")}
									</span>
								</div>
							</div>
							{event.recordingUrl && (
								<Button
									variant="ghost"
									size="sm"
									className="gap-1.5 shrink-0"
									asChild
								>
									<a
										href={event.recordingUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Video className="h-3.5 w-3.5" />
										{t("events.recording")}
										<ExternalLink className="h-3 w-3" />
									</a>
								</Button>
							)}
						</div>
					))}
					{pastEvents.length === 0 && (
						<div className="text-center py-16 space-y-3">
							<div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
								<Calendar className="h-6 w-6 text-muted-foreground" />
							</div>
							<h3 className="text-lg font-semibold">No past events</h3>
							<p className="text-sm text-muted-foreground max-w-sm mx-auto">
								Past events will appear here once they've concluded.
							</p>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function normalizeEvent(event: Awaited<ReturnType<typeof getUpcomingEvents>>[number]) {
	const startDate = new Date(event.startDate);
	const formattedDate = startDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
	const formattedTime = startDate.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		timeZone: event.timezone,
	});

	return {
		id: event._id,
		title: event.title,
		description: event.description,
		date: formattedDate,
		time: `${formattedTime} ${event.timezone}`,
		type: event.type,
		location: event.isOnline ? "online" : event.location || "TBA",
		attendees: event.attendeeCount,
		maxAttendees: event.maxAttendees ?? null,
		speakers: event.speakers || [],
		tags: event.tags || [],
	};
}

function normalizePastEvent(event: Awaited<ReturnType<typeof getPastEvents>>[number]) {
	const startDate = new Date(event.startDate);
	const formattedDate = startDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return {
		id: event._id,
		title: event.title,
		date: formattedDate,
		type: event.type,
		attendees: event.attendeeCount,
		recordingUrl: event.recordingUrl || undefined,
	};
}
