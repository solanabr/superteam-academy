import { create } from "zustand";

interface OnboardingState {
    isOpen: boolean;
    step: number;
    currentQuestion: number;
    answers: Record<string, number>;
    username: string;
    roleSelection: "student" | "professor";
    isSaving: boolean;
    setIsOpen: (isOpen: boolean) => void;
    setStep: (step: number) => void;
    setCurrentQuestion: (question: number) => void;
    setAnswer: (field: string, value: number) => void;
    setUsername: (username: string) => void;
    setRoleSelection: (role: "student" | "professor") => void;
    setIsSaving: (isSaving: boolean) => void;
    reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    isOpen: false,
    step: 0,
    currentQuestion: 0,
    answers: {},
    username: "",
    roleSelection: "student",
    isSaving: false,
    setIsOpen: (isOpen) => set({ isOpen }),
    setStep: (step) => set({ step }),
    setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
    setAnswer: (field, value) => set((state) => ({ answers: { ...state.answers, [field]: value } })),
    setUsername: (username) => set({ username }),
    setRoleSelection: (roleSelection) => set({ roleSelection }),
    setIsSaving: (isSaving) => set({ isSaving }),
    reset: () => set({ isOpen: false, step: 0, currentQuestion: 0, answers: {}, username: "", roleSelection: "student", isSaving: false }),
}));
