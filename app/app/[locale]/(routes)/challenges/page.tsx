/**
 * Challenges page — /challenges
 * Renders inside (routes) layout which provides sidebar + topbar.
 *
 * Preloads the banner image so the browser starts downloading it
 * before the client component mounts and renders the <Image>.
 */
import { ChallengesContent } from '@/components/challenges/ChallengesContent';

export const metadata = {
    title: 'Challenges | Superteam Academy',
    description: 'Test your skills with hands-on coding challenges.',
};

export default function ChallengesPage() {
    return <ChallengesContent />;
}
