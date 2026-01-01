import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* 404 Number */}
        <h1 className="text-8xl font-bold text-neutral-900 dark:text-white mb-4">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* Back to Home Button */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

