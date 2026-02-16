import LeaderboardPage from "@/components/leaderboard/LeaderboardPage";
import { Navbar } from "@/components/navbar";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";

export default async function Page() {
    await requireAuthenticatedUser();

    return (
        <div>
            <Navbar />
            <LeaderboardPage />
        </div>
    );
}
