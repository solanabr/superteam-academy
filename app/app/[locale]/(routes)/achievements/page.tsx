/**
 * Achievements & Credentials page — /achievements
 *
 * Preloads the banner image so the browser starts downloading it
 * before the client component mounts and renders the <Image>.
 */
import { AchievementsContent } from '@/components/achievement/AchievementsContent';

export const metadata = {
    title: 'Achievements & Credentials | Superteam Academy',
    description: 'Track your badges, unlock achievements, and view your on-chain credentials.',
};

export default function AchievementsPage() {
    return <AchievementsContent />;
}
