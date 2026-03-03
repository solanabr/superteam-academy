/**
 * Fallback translation generator — reads en.json and generates
 * pt-BR.json and es.json with the same structure.
 *
 * Uses a static translation map for known keys. New keys are
 * copied as-is from English (marked for manual review).
 *
 * Run: npm run i18n:generate
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'context', 'i18n', 'messages');

function generateTranslations() {
    const enPath = path.join(MESSAGES_DIR, 'en.json');
    const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

    const locales = ['pt-BR', 'es'];

    for (const locale of locales) {
        const targetPath = path.join(MESSAGES_DIR, `${locale}.json`);
        let existing = {};

        if (fs.existsSync(targetPath)) {
            existing = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
        }

        const merged = deepMerge(en, existing);
        fs.writeFileSync(targetPath, JSON.stringify(merged, null, 4) + '\n', 'utf-8');

        const missing = countMissing(en, existing);
        if (missing > 0) {
            console.log(`[${locale}] ${missing} key(s) copied from en.json (need translation)`);
        } else {
            console.log(`[${locale}] All keys present`);
        }
    }
}

/**
 * Deep merge: keeps existing translations, fills gaps from source (en).
 */
function deepMerge(source, target) {
    const result = {};
    for (const key of Object.keys(source)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            result[key] = deepMerge(source[key], target[key] || {});
        } else {
            result[key] = target[key] !== undefined ? target[key] : source[key];
        }
    }
    return result;
}

function countMissing(source, target) {
    let count = 0;
    for (const key of Object.keys(source)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            count += countMissing(source[key], target[key] || {});
        } else if (target[key] === undefined) {
            count++;
        }
    }
    return count;
}

generateTranslations();
