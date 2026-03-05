export function deriveLevel(xp) {
    if (!Number.isFinite(xp) || xp <= 0) {
        return 0;
    }
    return Math.floor(Math.sqrt(xp / 100));
}
