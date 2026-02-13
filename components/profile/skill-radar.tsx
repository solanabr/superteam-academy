import { useI18n } from '@/components/i18n/i18n-provider';
import { UserProfile } from '@/lib/types';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const angleRad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  };
}

export function SkillRadar({ profile }: { profile: UserProfile }): JSX.Element {
  const { dictionary } = useI18n();
  const center = 100;
  const radius = 74;
  const steps = 4;

  const points = profile.skills.map((skill, index) => {
    const angle = (360 / profile.skills.length) * index;
    const point = polarToCartesian(center, center, (skill.value / 100) * radius, angle);
    return `${point.x},${point.y}`;
  });

  return (
    <section className="panel space-y-3 p-5">
      <h3 className="text-sm font-semibold">{dictionary.skillRadarTitle}</h3>
      <div className="flex flex-wrap items-center gap-6">
        <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
          {Array.from({ length: steps }).map((_, index) => {
            const ratio = (index + 1) / steps;
            const ring = profile.skills
              .map((skill, itemIndex) => {
                const angle = (360 / profile.skills.length) * itemIndex;
                const point = polarToCartesian(center, center, ratio * radius, angle);
                return `${point.x},${point.y}`;
              })
              .join(' ');

            return <polygon key={ratio} points={ring} fill="none" stroke="rgba(148,163,184,0.3)" />;
          })}
          <polygon points={points.join(' ')} fill="rgba(13, 148, 136, 0.35)" stroke="rgba(20, 184, 166, 0.9)" />
        </svg>

        <ul className="space-y-2 text-sm">
          {profile.skills.map((skill) => (
            <li key={skill.name} className="flex items-center gap-3">
              <span className="w-28 text-foreground/75">{skill.name}</span>
              <div className="h-2 w-40 rounded-full bg-muted/90">
                <div className="h-full rounded-full bg-primary" style={{ width: `${skill.value}%` }} />
              </div>
              <span className="text-xs">{skill.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
