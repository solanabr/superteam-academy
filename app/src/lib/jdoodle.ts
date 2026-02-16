/**
 * JDoodle API integration utilities
 * Maps our language codes to JDoodle language codes and version indices
 */

export type SupportedLanguage = "rust" | "typescript" | "javascript" | "json";

export interface JDoodleLanguageConfig {
  language: string;
  versionIndex: string;
}

/**
 * Maps our internal language codes to JDoodle API language codes and version indices
 * Based on: https://www.jdoodle.com/docs/compiler-apis/supported-languages-versions
 */
export function getJDoodleLanguageConfig(
  lang: SupportedLanguage
): JDoodleLanguageConfig | null {
  const mapping: Record<SupportedLanguage, JDoodleLanguageConfig> = {
    rust: {
      language: "rust",
      versionIndex: "5", // Version 6.0
    },
    typescript: {
      language: "typescript",
      versionIndex: "0", // Version 6.1
    },
    javascript: {
      language: "nodejs", // JavaScript is NodeJS in JDoodle
      versionIndex: "6", // Version 6.1
    },
    json: {
      language: "nodejs", // JSON can be executed as JavaScript for validation
      versionIndex: "6",
    },
  };

  return mapping[lang] || null;
}

/**
 * Execute code via JDoodle API
 */
export interface JDoodleExecuteRequest {
  clientId: string;
  clientSecret: string;
  script: string;
  language: string;
  versionIndex: string;
  stdin?: string;
  compileOnly?: boolean;
}

export interface JDoodleExecuteResponse {
  output?: string;
  error?: string;
  statusCode: number;
  memory?: string;
  cpuTime?: string;
  compilationStatus?: number | null;
  projectKey?: string | null;
  isExecutionSuccess?: boolean;
  isCompiled?: boolean;
}

export async function executeJDoodle(
  request: JDoodleExecuteRequest
): Promise<JDoodleExecuteResponse> {
  const response = await fetch("https://api.jdoodle.com/v1/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId: request.clientId,
      clientSecret: request.clientSecret,
      script: request.script,
      language: request.language,
      versionIndex: request.versionIndex,
      stdin: request.stdin || "",
      compileOnly: request.compileOnly || false,
    }),
  });

  if (!response.ok) {
    // JDoodle returns 429 when daily API credit limit is reached (see api-timeout-errors docs)
    if (response.status === 429) {
      throw new Error("DAILY_LIMIT_REACHED");
    }
    const errorText = await response.text();
    throw new Error(
      `JDoodle API error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as JDoodleExecuteResponse;
  return data;
}
