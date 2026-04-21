import coreProtocol from "./glossary-data/terms/core-protocol.json";
import programmingModel from "./glossary-data/terms/programming-model.json";
import tokenEcosystem from "./glossary-data/terms/token-ecosystem.json";
import defi from "./glossary-data/terms/defi.json";
import zkCompression from "./glossary-data/terms/zk-compression.json";
import infrastructure from "./glossary-data/terms/infrastructure.json";
import security from "./glossary-data/terms/security.json";
import devTools from "./glossary-data/terms/dev-tools.json";
import network from "./glossary-data/terms/network.json";
import blockchainGeneral from "./glossary-data/terms/blockchain-general.json";
import web3 from "./glossary-data/terms/web3.json";
import programmingFundamentals from "./glossary-data/terms/programming-fundamentals.json";
import aiMl from "./glossary-data/terms/ai-ml.json";
import solanaEcosystem from "./glossary-data/terms/solana-ecosystem.json";
import ptBRTranslations from "./glossary-data/i18n/pt.json";
type TranslationMap = Record<string, { term?: string; definition?: string }>;

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  aliases?: string[];
  related?: string[];
}

const allData = [
  ...coreProtocol,
  ...programmingModel,
  ...tokenEcosystem,
  ...defi,
  ...zkCompression,
  ...infrastructure,
  ...security,
  ...devTools,
  ...network,
  ...blockchainGeneral,
  ...web3,
  ...programmingFundamentals,
  ...aiMl,
  ...solanaEcosystem,
] as GlossaryTerm[];

export const allTerms: GlossaryTerm[] = allData;

export const CATEGORIES = [
  "core-protocol",
  "programming-model",
  "token-ecosystem",
  "defi",
  "zk-compression",
  "infrastructure",
  "security",
  "dev-tools",
  "network",
  "blockchain-general",
  "web3",
  "programming-fundamentals",
  "ai-ml",
  "solana-ecosystem",
];

export function getTerm(
  idOrAlias: string,
  locale: string = "en"
): GlossaryTerm | undefined {
  const match = allTerms.find(
    (t) =>
      t.id === idOrAlias ||
      t.aliases?.some((a) => a.toLowerCase() === idOrAlias.toLowerCase())
  );

  if (!match) return undefined;

  if (locale === "pt-BR") {
    const translation = (ptBRTranslations as TranslationMap)[match.id];
    if (translation) {
      return {
        ...match,
        term: translation.term || match.term,
        definition: translation.definition || match.definition,
      };
    }
  }

  return match;
}

export function searchTerms(
  query: string,
  locale: string = "en"
): GlossaryTerm[] {
  const q = query.toLowerCase();
  return allTerms
    .filter((t) => {
      let trTerm = t.term;
      let trDef = t.definition;
      if (locale === "pt-BR") {
        const trans = (ptBRTranslations as TranslationMap)[t.id];
        if (trans) {
          trTerm = trans.term || t.term;
          trDef = trans.definition || t.definition;
        }
      }
      return (
        t.id.includes(q) ||
        trTerm.toLowerCase().includes(q) ||
        trDef.toLowerCase().includes(q) ||
        t.aliases?.some((a) => a.toLowerCase().includes(q))
      );
    })
    .map((t) => getTerm(t.id, locale) as GlossaryTerm);
}

export function getTermsByCategory(
  category: string,
  locale: string = "en"
): GlossaryTerm[] {
  return allTerms
    .filter((t) => t.category === category)
    .map((t) => getTerm(t.id, locale) as GlossaryTerm);
}

// Get localized full array
export function getAllLocalizedTerms(locale: string = "en"): GlossaryTerm[] {
  if (locale === "en") return allTerms;
  return allTerms.map((t) => getTerm(t.id, locale) as GlossaryTerm);
}
