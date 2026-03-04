export type ChallengeExample = {
  input?: string;
  output?: string;
  explanation?: string;
};

export type ChallengeTestCase = {
  input?: string;
  expected?: string;
  explanation?: string;
};

export type ChallengeViewSpec = {
  title?: string;
  description?: string;
  difficulty?: string;
  function_signature?: string;
  input_format?: string;
  output_format?: string;
  constraints?: string[] | string;
  examples?: ChallengeExample[];
  test_cases?: ChallengeTestCase[];
  starter_code?: string;
  language?: string;
  xp_reward?: number;
  time_estimate_minutes?: number;
  track_association?: string;
  raw?: Json_record;
};

type Json_record = Record<string, unknown>;

const is_json_record = (value: unknown): value is Json_record =>
  typeof value === "object" && value !== null;

const get_string = (record: Json_record, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const get_number = (record: Json_record, key: string): number | undefined => {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
};

const select_locale_spec = (parsed: Json_record, locale: string): Json_record => {
  const locales_value = parsed["locales"];

  if (!is_json_record(locales_value)) {
    return parsed;
  }

  const normalized = locale.toLowerCase();
  const base_locale = normalized.split("-")[0];

  const from_exact = locales_value[normalized];
  const from_base = locales_value[base_locale];
  const from_en = locales_value["en"];

  const selected = (from_exact ?? from_base ?? from_en) as unknown;

  if (is_json_record(selected)) {
    return selected;
  }

  return parsed;
};

export const parse_challenge_spec = (
  raw: string | null,
  locale: string,
): ChallengeViewSpec | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!is_json_record(parsed)) {
      return null;
    }

    const spec_source = select_locale_spec(parsed, locale);

    const constraints_value = spec_source["constraints"];
    const constraints =
      Array.isArray(constraints_value) || typeof constraints_value === "string"
        ? (constraints_value as string[] | string)
        : undefined;

    const examples_raw = spec_source["examples"];

    const examples: ChallengeExample[] | undefined = Array.isArray(examples_raw)
      ? examples_raw
          .filter(is_json_record)
          .map((item) => ({
            input: get_string(item, "input"),
            output: get_string(item, "output"),
            explanation: get_string(item, "explanation"),
          }))
      : undefined;

    const test_cases_raw = spec_source["test_cases"];

    const test_cases: ChallengeTestCase[] | undefined = Array.isArray(test_cases_raw)
      ? test_cases_raw
          .filter(is_json_record)
          .map((item) => ({
            input: get_string(item, "input"),
            expected: get_string(item, "expected"),
            explanation:
              get_string(item, "explanation") ??
              get_string(item, "description") ??
              get_string(item, "note"),
          }))
      : undefined;

    const spec: ChallengeViewSpec = {
      title: get_string(spec_source, "title"),
      description: get_string(spec_source, "description"),
      difficulty: get_string(spec_source, "difficulty"),
      function_signature: get_string(spec_source, "function_signature"),
      input_format: get_string(spec_source, "input_format"),
      output_format: get_string(spec_source, "output_format"),
      constraints,
      examples,
      test_cases,
      starter_code: get_string(spec_source, "starter_code"),
      language: get_string(spec_source, "language"),
      xp_reward: get_number(spec_source, "xp_reward"),
      time_estimate_minutes: get_number(spec_source, "time_estimate_minutes"),
      track_association: get_string(spec_source, "track_association"),
    };

    spec.raw = spec_source;

    return spec;
  } catch {
    return null;
  }
};

