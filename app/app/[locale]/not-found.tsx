import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-7xl font-bold text-purple-500/20">404</div>
        <div>
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="mt-2 text-gray-400">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-500"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/pt-BR/courses"
            className="flex items-center gap-2 rounded-lg border border-gray-700 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white"
          >
            <Search className="h-4 w-4" />
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
