import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center">
      <div className="text-center">
        <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-4">
          // ERROR
        </div>
        <h1 className="font-display font-black text-[120px] leading-none tracking-tighter text-[#1a1a1a] mb-4">
          404
        </h1>
        <h2 className="font-display font-black text-2xl uppercase tracking-tight text-[#9945ff] mb-4">
          PAGE_NOT_FOUND
        </h2>
        <p className="text-xs font-mono text-[#444] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <button className="px-6 py-3 bg-[#9945ff] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#8835ef] transition-colors">
            RETURN_HOME →
          </button>
        </Link>
      </div>
    </div>
  );
}