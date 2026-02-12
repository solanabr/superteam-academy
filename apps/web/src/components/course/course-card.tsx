import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Clock, Lightning, CheckCircle } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DifficultyBadge,
  chipBase,
} from "@/components/course/difficulty-badge";

interface CourseCardProps {
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  thumbnail?: string;
  xpReward: number;
  instructorName?: string;
  status?: "enrolled" | "completed";
}

export function CourseCard({
  slug,
  title,
  description,
  difficulty,
  duration,
  thumbnail,
  xpReward,
  instructorName,
  status,
}: CourseCardProps) {
  const t = useTranslations("courses");
  const locale = useLocale();

  return (
    <Link href={`/${locale}/courses/${slug}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="relative h-44 overflow-hidden bg-primary-bg">
          <Image
            src={thumbnail || "/cover.png"}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <DifficultyBadge difficulty={difficulty} label={t(difficulty)} />
          </div>
          {status === "enrolled" && (
            <div className="absolute right-3 top-3">
              <span className={`${chipBase} border-primary/40 text-primary`}>
                {t("enrolled")}
              </span>
            </div>
          )}
          {status === "completed" && (
            <div className="absolute right-3 top-3">
              <span
                className={`${chipBase} border-success/40 gap-1 text-success`}
              >
                <CheckCircle size={12} weight="fill" aria-hidden="true" />
                {t("completed")}
              </span>
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight transition-colors group-hover:text-primary">
            {title}
          </h3>
          {instructorName && (
            <p className="text-sm text-text-3">
              {t("courseBy")} {instructorName}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex-1">
          <p className="line-clamp-2 text-sm text-text-2">{description}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1 text-sm text-text-3">
            <Clock size={14} weight="duotone" className="text-text-3" />
            <span>
              {duration} {t("hours")}
            </span>
          </div>
          <span className="flex items-center gap-1 font-display font-black text-accent-dark dark:text-accent">
            <Lightning size={14} weight="duotone" className="text-accent" />
            {xpReward} XP
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
