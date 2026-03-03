export interface Course {
	id: string;
	title: string;
	description: string;
	category: string;
	level: string;
	duration: string;
	students: number;
	instructor: string;
	image: string;
	tags: string[];
	xpReward: number;
	price: number;
	featured?: boolean;
	enrolled?: boolean;
	progress?: number;
	gradient?: string;
}

export const LEVEL_COLORS: Record<string, string> = {
	beginner: "bg-green/10 text-green border-green/20",
	intermediate: "bg-gold/10 text-gold border-gold/20",
	advanced: "bg-destructive/10 text-destructive border-destructive/20",
};
