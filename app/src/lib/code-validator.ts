// app/src/lib/code-validator.ts

export interface ValidationRule {
    type: 'contains' | 'not_contains' | 'regex';
    value: string;
    errorMessage: string;
}

export interface LessonValidationConfig {
    rules: ValidationRule[];
}

// Конфигуратор правил для каждого урока. 
// В будущем эти правила будут храниться в БД (поле validationRules в модели Lesson).
export const LESSON_VALIDATORS: Record<string, LessonValidationConfig> = {
    // "solana-mock-test" -> "lesson-0" (Hello World)
    "solana-mock-test_0": {
        rules: [
            {
                type: 'regex',
                // Ищем макрос msg! с любым текстом внутри (игнорируя пробелы)
                value: 'msg!\\s*\\(.*"Hello World".*\\)',
                errorMessage: 'You must use the msg!() macro to print "Hello World".'
            },
            {
                type: 'contains',
                value: 'Ok(())',
                errorMessage: 'Your function must return Ok(()) at the end.'
            }
        ]
    },
    // "solana-mock-test" -> "lesson-1" (Accounts & Context)
    "solana-mock-test_1": {
        rules: [
            {
                type: 'regex',
                // Ищем объявление структуры с #[derive(Accounts)]
                value: '#\\[derive\\s*\\(\\s*Accounts\\s*\\)\\]\\s*pub\\s*struct',
                errorMessage: 'You must define a struct with the #[derive(Accounts)] macro.'
            }
        ]
    }
};

/**
 * Очищает код от комментариев (однострочных и многострочных) и лишних пробелов для более точного Regex-анализа
 */
function sanitizeCode(code: string): string {
    return code
        .replace(/\/\/.*$/gm, '') // Удалить однострочные комментарии //
        .replace(/\/\*[\s\S]*?\*\//g, '') // Удалить многострочные комментарии /* */
        .replace(/\s+/g, ' ') // Заменить табы, переносы строк и двойные пробелы на одинарный пробел
        .trim();
}

/**
 * Главная функция проверки кода
 */
export function validateCode(courseId: string, lessonIndex: number, userCode: string): { isValid: boolean; error?: string } {
    // Формируем ключ для поиска правил (например, "solana-mock-test_0")
    const ruleKey = `${courseId}_${lessonIndex}`;
    const config = LESSON_VALIDATORS[ruleKey];

    // Если правил нет, считаем код верным (fallback)
    if (!config || !config.rules || config.rules.length === 0) {
        return { isValid: true };
    }

    const cleanCode = sanitizeCode(userCode);

    for (const rule of config.rules) {
        if (rule.type === 'contains') {
            // Простая проверка (для безопасности убираем все пробелы из проверяемой строки и из кода)
            const noSpaceCode = cleanCode.replace(/\s/g, '');
            const noSpaceValue = rule.value.replace(/\s/g, '');
            if (!noSpaceCode.includes(noSpaceValue)) {
                return { isValid: false, error: rule.errorMessage };
            }
        } 
        else if (rule.type === 'not_contains') {
             const noSpaceCode = cleanCode.replace(/\s/g, '');
             const noSpaceValue = rule.value.replace(/\s/g, '');
             if (noSpaceCode.includes(noSpaceValue)) {
                 return { isValid: false, error: rule.errorMessage };
             }
        }
        else if (rule.type === 'regex') {
            const regex = new RegExp(rule.value);
            if (!regex.test(cleanCode)) {
                return { isValid: false, error: rule.errorMessage };
            }
        }
    }

    return { isValid: true };
}