import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function ProfileIndexPage() {
  return (
    <Shell title="Profile" subtitle="Public profile is shareable: /profile/[username].">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-zinc-600">
          This route will become the signed-in user profile. For now:
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm"
            href="/profile/yuki"
          >
            View sample public profile
          </Link>
          <Link className="rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white" href="/me">
            Signed-in profile (stub)
          </Link>
        </div>
      </div>
    </Shell>
  );
}
