// app/src/lib/code-validator.ts

export interface ValidationRule {
    type: 'contains' | 'not_contains' | 'regex';
    value: string;
    errorMessage: string;
}

export interface LessonValidationConfig {
    rules: ValidationRule[];
}

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
// Теперь функция принимает правила напрямую
export function validateCode(userCode: string, rules: ValidationRule[]): { isValid: boolean; error?: string } {
    if (!rules || rules.length === 0) {
        return { isValid: true };
    }

    const cleanCode = sanitizeCode(userCode);

    for (const rule of rules) {
        if (rule.type === 'contains') {
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