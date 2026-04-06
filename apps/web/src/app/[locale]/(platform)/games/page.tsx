"use client";

import Link from 'next/link';
import { Gamepad2, Zap, Trophy, BrainCircuit, Type, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export default function ArcadePage() {
  const t = useTranslations();

  const GAMES = [
    {
      id: 'conexo',
      title: 'Conexo.sol',
      description: t('arcade.conexo.desc'),
      icon: <BrainCircuit className="h-5 w-5 text-primary" />,
      badge: { text: "HOT", color: "text-red-500" },
      xp: 150,
      time: "5m",
      href: '/games/conexo',
    },
    {
      id: 'termo',
      title: 'Termo.sol',
      description: t('arcade.termo.desc'),
      icon: <Type className="h-5 w-5 text-primary" />,
      badge: { text: "NEW", color: "text-primary" },
      xp: 50,
      time: "2m",
      href: '/games/termo',
    },
    {
      id: 'contexto',
      title: 'Contexto.sol',
      description: t('arcade.contexto.desc'),
      icon: <Gamepad2 className="h-5 w-5 text-primary" />,
      xp: 100,
      time: "10m",
      href: '/games/contexto',
    },
    {
      id: 'expresso',
      title: 'Expresso.sol',
      description: t('arcade.expresso.desc'),
      icon: <Lightbulb className="h-5 w-5 text-primary" />,
      xp: 30,
      time: "1m",
      href: '/games/expresso',
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gamepad2 className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">{t('arcade.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('arcade.subtitle')}
        </p>
      </div>

      {/* Grid of Games */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
        {GAMES.map((game) => (
          <Link key={game.id} href={game.href} className="group outline-none">
            <Card className="h-full border-border/50 bg-black/20 transition-all duration-300 hover:border-primary/50 hover:bg-black/40">
              <CardContent className="flex h-full flex-col p-5">
                {/* Top Row: Icon/Badge and Time */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {game.badge && (
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${game.badge.color}`}>
                        {game.badge.text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1"><path d="M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM8 4.50001C8 4.22387 7.77614 4 7.5 4C7.22386 4 7 4.22387 7 4.50001V7.50001C7 7.63261 7.05268 7.75978 7.14645 7.85356L9.14645 9.85356C9.34171 10.0488 9.65829 10.0488 9.85355 9.85356C10.0488 9.65829 10.0488 9.34171 9.85355 9.14645L8 7.2929V4.50001Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                      {game.time}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-semibold tracking-tight mb-2 text-foreground group-hover:text-primary transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {game.description}
                </p>

                {/* Divider */}
                <div className="my-4 h-[1px] w-full bg-border/50" />

                {/* Bottom Stats (XP) */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5" />
                    {t('arcade.reward')}
                  </div>
                  <div className="flex items-center gap-1 font-medium text-primary">
                    <Zap className="h-3.5 w-3.5 fill-primary/20" />
                    +{game.xp} XP
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
