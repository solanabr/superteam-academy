import { create } from "zustand";

type UIState = {
    // Mobile menu state
    isMobileMenuOpen: boolean;

    // Profile dropdown state
    isProfileOpen: boolean;

    // Modal states
    modals: Record<string, boolean>;

    // Toast notifications
    toasts: Array<{
        id: string;
        message: string;
        type: "success" | "error" | "info" | "warning";
        duration?: number;
    }>;

    // Actions
    setMobileMenuOpen: (open: boolean) => void;
    toggleMobileMenu: () => void;
    setProfileOpen: (open: boolean) => void;
    toggleProfile: () => void;

    // Modal actions
    openModal: (modalId: string) => void;
    closeModal: (modalId: string) => void;
    toggleModal: (modalId: string) => void;

    // Toast actions
    addToast: (message: string, type?: "success" | "error" | "info" | "warning", duration?: number) => string;
    removeToast: (id: string) => void;

    // Reset
    reset: () => void;
};

const initialState = {
    isMobileMenuOpen: false,
    isProfileOpen: false,
    modals: {},
    toasts: [],
};

export const useUIStore = create<UIState>((set) => ({
    ...initialState,

    setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),

    toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

    setProfileOpen: (isProfileOpen) => set({ isProfileOpen }),

    toggleProfile: () => set((state) => ({ isProfileOpen: !state.isProfileOpen })),

    openModal: (modalId) => {
        set((state) => ({
            modals: { ...state.modals, [modalId]: true },
        }));
    },

    closeModal: (modalId) => {
        set((state) => ({
            modals: { ...state.modals, [modalId]: false },
        }));
    },

    toggleModal: (modalId) => {
        set((state) => ({
            modals: { ...state.modals, [modalId]: !state.modals[modalId] },
        }));
    },

    addToast: (message, type = "info", duration = 5000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;

        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }],
        }));

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((toast) => toast.id !== id),
                }));
            }, duration);
        }

        return id;
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
    },

    reset: () => set(initialState),
}));
