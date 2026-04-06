"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Book, Tags } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { getAllLocalizedTerms } from "@/lib/glossary";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function DictionaryTab() {
  const t = useTranslations();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const localizedTerms = useMemo(() => getAllLocalizedTerms(locale), [locale]);

  const filteredTerms = useMemo(() => {
    return localizedTerms.filter((term) => {
      const matchCat = activeCategory === "all" || term.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        q.trim() === "" ||
        term.term.toLowerCase().includes(q) ||
        term.definition.toLowerCase().includes(q) ||
        (term.aliases && term.aliases.some((a) => a.toLowerCase().includes(q)));
      
      return matchCat && matchSearch;
    });
  }, [search, activeCategory, localizedTerms]);

  return (
    <div className="flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Book className="h-6 w-6 text-primary" />
            {t('dictionary.title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('dictionary.subtitle')}
          </p>
        </div>
        
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('dictionary.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 md:w-64 bg-black/20"
            />
          </div>
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto overflow-x-auto custom-scrollbar">
            <TabsList className="w-fit flex-nowrap shrink-0 overflow-visible text-xs gap-1 py-4 sm:py-0">
              <TabsTrigger value="all">{t('dictionary.tab.all')}</TabsTrigger>
              <TabsTrigger value="core-protocol">{t('dictionary.tab.protocol')}</TabsTrigger>
              <TabsTrigger value="token-ecosystem">{t('dictionary.tab.tokens')}</TabsTrigger>
              <TabsTrigger value="defi">{t('dictionary.tab.defi')}</TabsTrigger>
              <TabsTrigger value="dev-tools">{t('dictionary.tab.tools')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTerms.slice(0, 50).map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i % 15) * 0.05, duration: 0.35 }}
          >
            <Card className="group h-full border-border/50 bg-black/20 hover:border-primary/50 hover:bg-black/40 hover:shadow-[0_0_15px_rgba(20,241,149,0.05)] transition-all">
              <CardContent className="flex h-full flex-col p-5">
                <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-3">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors pr-2">
                    {item.term}
                  </h3>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase opacity-70 group-hover:opacity-100 flex-shrink-0">
                    {item.category.replace(/-/g, ' ')}
                  </Badge>
                </div>
                
                <p className="text-sm leading-relaxed text-muted-foreground flex-1 mb-4">
                  {item.definition}
                </p>

                {item.aliases && item.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto pt-3 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground mr-1 w-full uppercase font-medium">{t('dictionary.synonyms')}</span>
                    {item.aliases.map((alias) => (
                       <span key={alias} className="text-xs bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-foreground/80">
                         {alias}
                       </span>
                    ))}
                  </div>
                )}
                {item.related && item.related.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-muted-foreground mr-1 flex items-center gap-1 w-full uppercase font-medium">
                      <Tags className="h-3 w-3" /> {t('dictionary.related')}
                    </span>
                    {item.related.slice(0, 3).map((rel) => (
                       <span key={rel} className="text-xs text-primary/80 px-1.5 py-0.5 opacity-80 cursor-pointer hover:underline">
                         @{rel}
                       </span>
                    ))}
                    {item.related.length > 3 && (
                      <span className="text-[10px] text-muted-foreground ml-1 py-1">+{item.related.length - 3}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredTerms.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {t('dictionary.empty')}
            </p>
          </div>
        )}
      </div>

      {filteredTerms.length > 50 && (
         <div className="col-span-full mt-8 py-8 border-t border-border/50 text-center text-sm text-muted-foreground">
           {t('dictionary.showing')} {filteredTerms.length}. {t('dictionary.refine')}
         </div>
      )}
    </div>
  );
}

