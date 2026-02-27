export interface QuizQuestion {
  id: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export function parseQuizContent(text: string): {
  intro: string;
  questions: QuizQuestion[];
} {
  const blocks = text.split(/\n\n/);
  const questions: QuizQuestion[] = [];
  let intro = "";

  for (const block of blocks) {
    const trimmed = block.trim();
    const questionMatch = trimmed.match(
      new RegExp(
        "^(\\d+)\\.\\s+(.+?)(?:\\n\\s+)((?:[a-d]\\).+?))\\n\\s+Answer:\\s*([a-d])\\)\\s*(.+)$",
        "s",
      ),
    );
    if (questionMatch) {
      const questionNum = parseInt(questionMatch[1]);
      const questionText = questionMatch[2].trim();
      const optionsRaw = questionMatch[3];
      const correctLetter = questionMatch[4];
      const explanation =
        questionMatch[5].split("\u2014").slice(1).join("\u2014").trim() ||
        questionMatch[5].trim();

      const options: { label: string; text: string }[] = [];
      const parts = optionsRaw.split(/\s{2,}(?=[a-d]\))/);
      for (const part of parts) {
        const m = part.match(/^([a-d])\)\s*([\s\S]+)/);
        if (m) {
          options.push({ label: m[1], text: m[2].trim() });
        }
      }

      if (options.length >= 2) {
        questions.push({
          id: questionNum,
          question: questionText,
          options,
          correctAnswer: correctLetter,
          explanation,
        });
        continue;
      }
    }
    if (questions.length === 0 && trimmed) {
      intro = trimmed;
    }
  }

  return { intro, questions };
}
