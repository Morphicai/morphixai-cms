import Link from 'next/link';

export default function ComingSoonDoc({ 
  title,
  description,
  backLink = '/docs',
  backText = 'Back to Docs'
}: { 
  title: string;
  description?: string;
  backLink?: string;
  backText?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Icon */}
      <div className="w-24 h-24 mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center">
        <svg className="w-12 h-12 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
        {title}
      </h1>

      {/* Description */}
      {description && (
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          {description}
        </p>
      )}

      {/* Status Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full mb-12">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Coming Soon</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link 
          href={backLink}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {backText}
        </Link>
        <Link 
          href="/"
          className="px-6 py-3 border border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>

      {/* Additional Info */}
      <p className="mt-12 text-sm text-slate-500 dark:text-slate-500">
        We are working hard to improve the documentation. Thank you for your patience.
      </p>
    </div>
  );
}

