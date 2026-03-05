// Credential (cNFT) data structures and mock data

export interface Credential {
	id: string;
	track: string; // e.g., "SOLANA_CORE_TRACK"
	level: number;
	tier: string; // "NOVICE", "ELITE", "LEGENDARY"
	mintAddress: string;
	gradient: string; // CSS gradient
	icon: string; // Bootstrap icon
	verified: boolean;
}

export interface SkillRadar {
	rust: number; // 0-100
	anchor: number;
	frontend: number;
	security: number;
	governance: number;
}

// Mock credentials
export const mockUserCredentials: Credential[] = [
	{
		id: "cred-1",
		track: "SOLANA_CORE_TRACK",
		level: 10,
		tier: "LEGENDARY",
		mintAddress: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
		gradient: "linear-gradient(45deg, #0d1412 0%, #3a4b48 100%)",
		icon: "bi-hexagon",
		verified: true,
	},
	{
		id: "cred-2",
		track: "ANCHOR_FRAMEWORK",
		level: 4,
		tier: "ELITE",
		mintAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
		gradient: "linear-gradient(135deg, #2b55c9 0%, #0d1412 100%)",
		icon: "bi-shield-lock",
		verified: true,
	},
	{
		id: "cred-3",
		track: "SECURITY_AUDITING",
		level: 1,
		tier: "NOVICE",
		mintAddress: "DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK",
		gradient: "#D1DEDC",
		icon: "bi-diamond",
		verified: true,
	},
];

// Mock skill radar data
export const mockSkillRadar: SkillRadar = {
	rust: 85,
	anchor: 70,
	frontend: 60,
	security: 75,
	governance: 35,
};

// Helper functions
export function getUserCredentials(userId?: string): Credential[] {
	// In real app, fetch by userId
	return mockUserCredentials;
}

export function getUserSkillRadar(userId?: string): SkillRadar {
	// In real app, calculate from completed courses
	return mockSkillRadar;
}
