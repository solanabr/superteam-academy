'use client';

import { Download } from 'lucide-react';

export default function DownloadCertButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 flex-1 justify-center rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:border-green-600/50 hover:text-green-400 hover:bg-green-900/20 transition-all"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
