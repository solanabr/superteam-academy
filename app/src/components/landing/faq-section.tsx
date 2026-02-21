"use client";

import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedSection } from "./animated-section";

const FAQ_COUNT = 7;

export function FAQSection() {
  const t = useTranslations("landing.faq");

  return (
    <AnimatedSection>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold sm:text-4xl">
            {t("sectionTitle")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("sectionSubtitle")}
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {Array.from({ length: FAQ_COUNT }, (_, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border bg-card px-6 data-[state=open]:border-primary/20"
              >
                <AccordionTrigger className="text-base font-medium hover:no-underline">
                  {t(`items.${i}.question`)}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {t(`items.${i}.answer`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </AnimatedSection>
  );
}
