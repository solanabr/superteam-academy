/**
 * Achievement seed data — 15 achievements across 5 categories.
 * Matches the Achievement model: { id: String @id, name, description, icon, category, xpReward }
 */
export function getAchievements() {
  return [
    // Progress
    {
      id: "first-steps",
      name: "First Steps",
      description: "Complete your first lesson",
      icon: "Footprints",
      category: "progress",
      xpReward: 25,
    },
    {
      id: "course-completer",
      name: "Course Completer",
      description: "Complete an entire course",
      icon: "GraduationCap",
      category: "progress",
      xpReward: 100,
    },
    {
      id: "speed-runner",
      name: "Speed Runner",
      description: "Complete a course in under 24 hours",
      icon: "Zap",
      category: "progress",
      xpReward: 150,
    },
    // Streaks
    {
      id: "week-warrior",
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "Flame",
      category: "streaks",
      xpReward: 75,
    },
    {
      id: "monthly-master",
      name: "Monthly Master",
      description: "Maintain a 30-day streak",
      icon: "Calendar",
      category: "streaks",
      xpReward: 200,
    },
    {
      id: "consistency-king",
      name: "Consistency King",
      description: "Maintain a 100-day streak",
      icon: "Crown",
      category: "streaks",
      xpReward: 500,
    },
    // Skills
    {
      id: "rust-rookie",
      name: "Rust Rookie",
      description: "Complete a Rust-based course",
      icon: "Code",
      category: "skills",
      xpReward: 100,
    },
    {
      id: "anchor-expert",
      name: "Anchor Expert",
      description: "Complete all Anchor track courses",
      icon: "Anchor",
      category: "skills",
      xpReward: 300,
    },
    {
      id: "full-stack-solana",
      name: "Full Stack Solana",
      description: "Complete courses from 3 different tracks",
      icon: "Layers",
      category: "skills",
      xpReward: 250,
    },
    // Community
    {
      id: "helper",
      name: "Helper",
      description: "Help another learner in discussions",
      icon: "HandHelping",
      category: "community",
      xpReward: 50,
    },
    {
      id: "first-comment",
      name: "First Comment",
      description: "Leave your first discussion comment",
      icon: "MessageSquare",
      category: "community",
      xpReward: 25,
    },
    {
      id: "top-contributor",
      name: "Top Contributor",
      description: "Get 10 upvotes on your comments",
      icon: "Star",
      category: "community",
      xpReward: 150,
    },
    // Special
    {
      id: "early-adopter",
      name: "Early Adopter",
      description: "Join during the first month",
      icon: "Sparkles",
      category: "special",
      xpReward: 100,
    },
    {
      id: "bug-hunter",
      name: "Bug Hunter",
      description: "Report a bug that gets fixed",
      icon: "Bug",
      category: "special",
      xpReward: 200,
    },
    {
      id: "perfect-score",
      name: "Perfect Score",
      description: "Complete all challenges in a course without hints",
      icon: "Trophy",
      category: "special",
      xpReward: 300,
    },
  ];
}
