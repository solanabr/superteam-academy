import { AchievementCard } from "@/components/gamification/achievement-card";
import { Badge } from "@/components/ui/badge";
import { mockAchievements, mockCourses, mockProfiles } from "@/lib/data/mock-courses";
import { credentialService } from "@/lib/services/credential-service";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = mockProfiles.find((item) => item.username === username || (username === "you" && item.id === "u-local"));

  if (!profile) {
    notFound();
  }

  const credentials = await credentialService.getCredentialsByWallet(profile.walletAddress ?? "");

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-6">
        <h1 className="text-3xl font-semibold text-foreground">{profile.displayName}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{profile.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <Badge key={interest} variant="outline" className="border-border text-muted-foreground">{interest}</Badge>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Skill radar</h2>
          <RadarChart values={profile.skills} />
        </article>
        <article className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Enrolled courses</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {mockCourses
              .filter((course) => profile.enrolledCourseIds.includes(course.id))
              .map((course) => (
                <li key={course.id}>
                  <Link href={`/courses/${course.slug}`} className="hover:text-[#ffd23f]">{course.title}</Link>
                </li>
              ))}
          </ul>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {mockAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Credentials</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {credentials.map((credential) => (
            <Link
              key={credential.id}
              href={`/certificates/${credential.id}`}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <Image
                src={credential.imageUri}
                alt={credential.title}
                width={600}
                height={300}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <p className="text-sm font-semibold text-foreground">{credential.title}</p>
                <p className="text-xs text-muted-foreground">Issued {new Date(credential.issuedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function RadarChart({ values }: { values: Record<string, number> }) {
  const entries = Object.entries(values);
  const center = 110;
  const radius = 90;
  const points = entries
    .map(([, value], index) => {
      const angle = (Math.PI * 2 * index) / entries.length - Math.PI / 2;
      const scaled = (value / 100) * radius;
      const x = center + Math.cos(angle) * scaled;
      const y = center + Math.sin(angle) * scaled;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 220" className="h-56 w-56">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={radius * scale}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
          />
        ))}
        <polygon points={points} fill="rgba(255,210,63,0.22)" stroke="#ffd23f" strokeWidth="2" />
      </svg>
      <div className="grid w-full grid-cols-2 gap-2 text-xs text-muted-foreground">
        {entries.map(([name, value]) => (
          <p key={name}>{name}: {value}</p>
        ))}
      </div>
    </div>
  );
}
