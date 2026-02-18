export type Achievement = {
    id: string;
    title: string;
    description: string;
    xp: number;
    bitIndex: number;
    icon: string;
};

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first-lesson",
        title: "First Steps",
        description: "Complete your first lesson.",
        xp: 100,
        bitIndex: 1,
        icon: "🌱",
    },
    {
        id: "first-course",
        title: "Course Graduate",
        description: "Complete a full course.",
        xp: 500,
        bitIndex: 2,
        icon: "🎓",
    },
    {
        id: "streak-3",
        title: "Consistency is Key",
        description: "Maintain a 3-day streak.",
        xp: 200,
        bitIndex: 3,
        icon: "🔥",
    },
    {
        id: "streak-7",
        title: "Unstoppable",
        description: "Maintain a 7-day streak.",
        xp: 500,
        bitIndex: 4,
        icon: "🚀",
    },
    {
        id: "early-bird",
        title: "Early Bird",
        description: "Complete a lesson before 8 AM.",
        xp: 150,
        bitIndex: 5,
        icon: "🌅",
    },
    {
        id: "night-owl",
        title: "Night Owl",
        description: "Complete a lesson after 10 PM.",
        xp: 150,
        bitIndex: 6,
        icon: "🦉",
    },
];
