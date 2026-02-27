type CounterMap = Map<string, number>;
type DurationSample = {
	count: number;
	totalMs: number;
	maxMs: number;
};

const counters: CounterMap = new Map();
const durations = new Map<string, DurationSample>();
const lastUpdatedAt = new Map<string, number>();

export function incrementMetric(name: string, delta = 1): void {
	const current = counters.get(name) ?? 0;
	counters.set(name, current + delta);
	lastUpdatedAt.set(name, Date.now());
}

export function recordDuration(name: string, durationMs: number): void {
	const current = durations.get(name) ?? { count: 0, totalMs: 0, maxMs: 0 };
	const next: DurationSample = {
		count: current.count + 1,
		totalMs: current.totalMs + durationMs,
		maxMs: Math.max(current.maxMs, durationMs),
	};
	durations.set(name, next);
	lastUpdatedAt.set(name, Date.now());
}

export function getMetricsSnapshot() {
	const counterEntries = [...counters.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	const durationEntries = [...durations.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([name, sample]) => ({
			name,
			count: sample.count,
			avgMs: sample.count > 0 ? Number((sample.totalMs / sample.count).toFixed(2)) : 0,
			maxMs: Number(sample.maxMs.toFixed(2)),
			totalMs: Number(sample.totalMs.toFixed(2)),
			lastUpdatedAt: lastUpdatedAt.get(name) ?? null,
		}));

	return {
		generatedAt: Date.now(),
		counters: counterEntries.map(([name, value]) => ({
			name,
			value,
			lastUpdatedAt: lastUpdatedAt.get(name) ?? null,
		})),
		durations: durationEntries,
	};
}
