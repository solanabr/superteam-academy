/**
 * Public profile layout — no sidebar, no WalletGuard.
 * The global navbar is already rendered by the root layout's NavbarWrapper.
 */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
