import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptBR from "@/messages/pt-BR.json";

/**
 * The question "Explain this error" asks the tutor, as the route sees it.
 *
 * The text lives in the message catalogs, where the editor reads it too. This
 * module loads all three catalogs, so import it from server code only.
 */
const DEFAULT_QUESTION = en.aiPartner.explainError.message;

const QUESTIONS: readonly string[] = [
  DEFAULT_QUESTION,
  ptBR.aiPartner.explainError.message,
  es.aiPartner.explainError.message,
];

/**
 * The fixed question for a request that carries the `explainError` flag.
 *
 * `clientMessage` only selects the language: when it is exactly one of the
 * catalog questions, that one is asked. Any other value gives the English
 * question, so no text from the client reaches the prompt or the log.
 */
export function explainErrorQuestion(clientMessage: unknown): string {
  return typeof clientMessage === "string" && QUESTIONS.includes(clientMessage)
    ? clientMessage
    : DEFAULT_QUESTION;
}
