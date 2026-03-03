/**
 * Community page — /community
 * Renders inside (routes) layout which provides sidebar + topbar.
 *
 * Preloads the banner image so the browser starts downloading it
 * before the client component mounts and renders the <Image>.
 */
import { CommunityPageContent } from '@/components/community/CommunityPageContent';

export const metadata = {
    title: 'Community | Superteam Academy',
    description: 'Discuss, ask questions, and share with the community.',
};

export default function CommunityPage() {
    return <CommunityPageContent />;
}
