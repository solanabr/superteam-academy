import { create } from "zustand";
import { SupportedLanguage } from "@/components/lessons/CodeEditor";

export type TestResult = {
    name: string;
    passed: boolean;
    input?: string;
    expected?: string;
    actual?: string;
    error?: string;
};

export type PlaygroundState = {
    // Map of lessonId -> code content
    code: Record<string, string>;

    // Map of lessonId -> language
    language: Record<string, SupportedLanguage>;

    // Map of lessonId -> output
    output: Record<string, string>;

    // Map of lessonId -> execution status
    status: Record<string, "idle" | "running" | "success" | "error">;

    // Map of lessonId -> execution stats
    stats: Record<string, { memory?: string; cpuTime?: string }>;

    // Map of lessonId -> detailed test case runs
    testResults: Record<string, TestResult[]>;

    // Daily limit tracking
    dailyLimitReached: boolean;

    // Actions
    setCode: (lessonId: string, code: string) => void;
    setLanguage: (lessonId: string, language: SupportedLanguage) => void;
    setOutput: (lessonId: string, output: string) => void;
    setStatus: (lessonId: string, status: "idle" | "running" | "success" | "error") => void;
    setStats: (lessonId: string, stats: { memory?: string; cpuTime?: string }) => void;
    setTestResults: (lessonId: string, results: TestResult[]) => void;
    setDailyLimitReached: (reached: boolean) => void;

    // Clear playground for a lesson
    clearLesson: (lessonId: string) => void;

    // Reset all
    reset: () => void;
};

const initialState = {
    code: {},
    language: {},
    output: {},
    status: {},
    stats: {},
    testResults: {},
    dailyLimitReached: false,
};

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
    ...initialState,

    setCode: (lessonId, code) => {
        set((state) => ({
            code: { ...state.code, [lessonId]: code },
        }));
    },

    setLanguage: (lessonId, language) => {
        set((state) => ({
            language: { ...state.language, [lessonId]: language },
        }));
    },

    setOutput: (lessonId, output) => {
        set((state) => ({
            output: { ...state.output, [lessonId]: output },
        }));
    },

    setStatus: (lessonId, status) => {
        set((state) => ({
            status: { ...state.status, [lessonId]: status },
        }));
    },

    setStats: (lessonId, stats) => {
        set((state) => ({
            stats: { ...state.stats, [lessonId]: stats },
        }));
    },

    setTestResults: (lessonId, results) => {
        set((state) => ({
            testResults: { ...state.testResults, [lessonId]: results },
        }));
    },

    setDailyLimitReached: (dailyLimitReached) => set({ dailyLimitReached }),

    clearLesson: (lessonId) => {
        set((state) => {
            const { [lessonId]: _code, ...restCode } = state.code;
            const { [lessonId]: _lang, ...restLang } = state.language;
            const { [lessonId]: _out, ...restOut } = state.output;
            const { [lessonId]: _status, ...restStatus } = state.status;
            const { [lessonId]: _stats, ...restStats } = state.stats;
            const { [lessonId]: _testResult, ...restTestResults } = state.testResults;

            return {
                code: restCode,
                language: restLang,
                output: restOut,
                status: restStatus,
                stats: restStats,
                testResults: restTestResults,
            };
        });
    },

    reset: () => set(initialState),
}));
