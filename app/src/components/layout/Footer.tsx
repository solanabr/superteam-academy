export default function Footer() {
  return (
    <footer className="border-t border-surface-800 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-surface-200">
            <div className="h-6 w-6 rounded bg-brand-600 flex items-center justify-center text-xs font-bold">S</div>
            <span>Superteam Academy</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-surface-200">
            <a href="https://superteam.fun" target="_blank" rel="noopener" className="hover:text-surface-50 transition-colors">
              Superteam
            </a>
            <a href="https://solana.com" target="_blank" rel="noopener" className="hover:text-surface-50 transition-colors">
              Solana
            </a>
            <span>Built on Solana</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
