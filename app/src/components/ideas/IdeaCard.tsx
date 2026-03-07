"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { MarketplaceCard } from "@/components/ui/marketplace-card";
import { IdeaStageBadge } from "./IdeaStageBadge";
import { TeamMatchBadge } from "./TeamMatchBadge";
import { Users } from "lucide-react";

export interface Idea {
  id: string;
  title: string;
  problem: string;
  solution: string;
  stage: "idea" | "mvp" | "launched";
  lookingFor: string[];
  skillsNeeded: string[];
  author?: {
    name: string;
    avatar?: string;
  };
  interestedCount: number;
  createdAt: string;
}

interface IdeaCardProps {
  idea: Idea;
  userSkills?: string[];
  onExpressInterest?: (ideaId: string) => void;
}

export function IdeaCard({ idea, userSkills = [], onExpressInterest }: IdeaCardProps) {
  const tCommon = useTranslations("common");
  const tIdeas = useTranslations("ideas");

  return (
    <MarketplaceCard interactive className="marketplace-card-shell h-full">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="line-clamp-2 text-lg font-semibold text-foreground">{idea.title}</h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {idea.author ? <span>{idea.author.name}</span> : null}
              <TeamMatchBadge skillsNeeded={idea.skillsNeeded} userSkills={userSkills} />
            </div>
          </div>
          <IdeaStageBadge stage={idea.stage} />
        </div>

        <div className="marketplace-meta-row">
          <Badge variant="outline" className="marketplace-pill">
            <Users className="h-3.5 w-3.5" />
            {tIdeas("lookingFor")}
          </Badge>
          {idea.lookingFor.slice(0, 2).map((role) => (
            <Badge key={role} variant="outline" className="marketplace-pill">
              {role}
            </Badge>
          ))}
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{idea.problem}</p>

        <div className="marketplace-meta-row">
          <Badge variant="outline" className="marketplace-pill">
            {idea.createdAt}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 px-5 pb-5 pt-0">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" />
            {idea.interestedCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link href={`/ideas/${idea.id}`}>{tCommon("learnMore")}</Link>
          </Button>
          <Button size="sm" className="rounded-xl" onClick={() => onExpressInterest?.(idea.id)}>
            {tIdeas("expressInterest")}
          </Button>
        </div>
      </CardFooter>
    </MarketplaceCard>
  );
}
