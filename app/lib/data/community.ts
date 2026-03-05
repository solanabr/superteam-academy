export interface CommunityEvent {
	id: string;
	title: string;
	date: string; // ISO string or human readable
	type: "IRL" | "ONLINE";
	location: string;
	attendees: number;
}

export interface Comment {
	id: string;
	author: string;
	avatar: string;
	content: string;
	timestamp: string;
	likes: number;
}

export interface DiscussionThread {
	id: string;
	slug: string;
	title: string;
	author: string;
	avatar: string;
	replies: number;
	lastActive: string;
	category: string;
	content: string;
	comments: Comment[];
}

export const mockEvents: CommunityEvent[] = [
	{
		id: "ev-1",
		title: "Solana Hacker House: Mumbai",
		date: "Oct 15 - 18, 2026",
		type: "IRL",
		location: "Mumbai, India",
		attendees: 420,
	},
	{
		id: "ev-2",
		title: "Anchor 0.30 Deep Dive",
		date: "Next Tuesday, 18:00 UTC",
		type: "ONLINE",
		location: "Discord Stage",
		attendees: 156,
	},
	{
		id: "ev-3",
		title: "Superteam UK Meetup",
		date: "Nov 5, 2026",
		type: "IRL",
		location: "London, UK",
		attendees: 85,
	},
];

export const mockDiscussions: DiscussionThread[] = [
	{
		id: "disc-1",
		slug: "how-to-handle-pda-collisions-dynamically",
		title: "How to handle PDA collisions dynamically?",
		author: "0xKONRAD",
		avatar: "bi bi-person-bounding-box",
		replies: 12,
		lastActive: "2h ago",
		category: "Architecture",
		content:
			"When generating PDAs in Anchor, I sometimes get collisions because my seed derivations overlap for different logical entities. How are you guys architecting your seed structures to guarantee uniqueness across the entire program?",
		comments: [
			{
				id: "c-1",
				author: "rust_ace",
				avatar: "bi bi-person-badge",
				content:
					'You should always prepend a static namespace string to your seeds. For example: `[b"user_profile", user_pubkey.as_ref()]`.',
				timestamp: "1h ago",
				likes: 5,
			},
			{
				id: "c-2",
				author: "0xKONRAD",
				avatar: "bi bi-person-bounding-box",
				content:
					"Yeah, I do that, but what if multiple components need to derive from the same pubkey without creating overlapping namespaces? Just append an enum variant?",
				timestamp: "45m ago",
				likes: 1,
			},
		],
	},
	{
		id: "disc-2",
		slug: "metaplex-core-vs-token-2022-for-xp",
		title: "Metaplex Core vs Token-2022 for XP?",
		author: "sol_dev_99",
		avatar: "bi bi-controller",
		replies: 45,
		lastActive: "5m ago",
		category: "Discussion",
		content:
			"For an XP system, is it better to use Token-2022 with NonTransferable extension, or just mint a Metaplex Core NFT and keep updating its metadata? Thoughts?",
		comments: [
			{
				id: "c-3",
				author: "architect_xyz",
				avatar: "bi bi-cpu",
				content:
					"Token-2022 is much cheaper for fungible XP points. Core is better for the actual Certificates.",
				timestamp: "2m ago",
				likes: 12,
			},
		],
	},
	{
		id: "disc-3",
		slug: "looking-for-teammates-for-next-hackathon",
		title: "Looking for teammates for the next hackathon",
		author: "builder_jo",
		avatar: "bi bi-emoji-sunglasses",
		replies: 3,
		lastActive: "1d ago",
		category: "Networking",
		content:
			"I am a frontend dev (React/Next) looking for a Rust/Anchor dev for the upcoming radar hackathon. Let me know if you want to team up!",
		comments: [],
	},
	{
		id: "disc-4",
		slug: "anyone-submitting-to-the-frontend-bounty",
		title: "Anyone submitting to the frontend bounty?",
		author: "frontender_00",
		avatar: "bi bi-laptop",
		replies: 15,
		lastActive: "5h ago",
		category: "Discussion",
		content:
			"Just saw the Superteam 4.8k USDC bounty for building the frontend of this platform! Is anyone else here participating? Would love to share tips on handling the Anchor PDA integrations.",
		comments: [
			{
				id: "c-4",
				author: "anon_coder",
				avatar: "bi bi-person-badge",
				content:
					"I am! Though the Metaplex Core credential part is a bit tricky to mock.",
				timestamp: "4h ago",
				likes: 3,
			},
		],
	},
	{
		id: "disc-5",
		slug: "how-does-anchor-calculate-cu-limits",
		title: "How does Anchor calculate CU limits?",
		author: "sys_admin",
		avatar: "bi bi-terminal",
		replies: 2,
		lastActive: "12h ago",
		category: "Architecture",
		content:
			"I keep hitting Compute Unit limits on my localnet testing even though my instructions are simple. What is the default limit Anchor allocates before I explicitly request more?",
		comments: [],
	},
];
