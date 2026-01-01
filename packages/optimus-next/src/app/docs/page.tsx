import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'Complete documentation for Optimus platform including API reference, guides, and examples.',
  openGraph: {
    title: 'Documentation - Optimus',
    description: 'Complete documentation for Optimus platform',
    type: 'website',
  },
};

export default function DocsPage() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-8">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200">Home</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 dark:text-slate-200 font-medium">Documentation</span>
      </div>

      {/* Title */}
      <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-6">
        Welcome to Optimus
      </h1>
      
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
        Optimus is a modern enterprise-level solution platform that provides complete technology stack support for developers and enterprises.
      </p>

      {/* Quick Start Cards */}
      <div className="grid sm:grid-cols-2 gap-6 mb-16">
        <Link href="/docs/getting-started" className="group">
          <div className="p-6 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md bg-white dark:bg-slate-800/50">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Quick Start</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Build your first application in 5 minutes</p>
          </div>
        </Link>

        <Link href="/docs/api/auth" className="group">
          <div className="p-6 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-md bg-white dark:bg-slate-800/50">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">API Documentation</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Complete API reference and usage examples</p>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">What is Optimus?</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
          Optimus is a full-stack enterprise-level solution that provides complete support from backend APIs to frontend interfaces.
          Our goal is to help developers and enterprises quickly build, deploy, and scale applications.
        </p>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Core Features</h3>
        <div className="grid gap-3 mb-8">
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">RESTful API</strong>
              <span className="text-slate-600 dark:text-slate-400"> - Complete API service with JWT authentication</span>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">User Management</strong>
              <span className="text-slate-600 dark:text-slate-400"> - Complete user system including registration, login, and permission management</span>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Business Modules</strong>
              <span className="text-slate-600 dark:text-slate-400"> - Pre-built common business modules for quick project startup</span>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white">Data Management</strong>
              <span className="text-slate-600 dark:text-slate-400"> - Powerful database support and ORM integration</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Technology Stack</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { name: 'NestJS', color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
            { name: 'Next.js', color: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
            { name: 'TypeScript', color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
            { name: 'PostgreSQL', color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
          ].map((tech) => (
            <div key={tech.name} className={`p-4 border ${tech.color} rounded-lg text-center`}>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tech.name}</div>
            </div>
          ))}
        </div>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Next Steps</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">Choose a topic to get started:</p>
      </div>

      {/* Next Steps */}
      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        <Link href="/docs/getting-started" className="group p-5 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md bg-white dark:bg-slate-800/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            Quick Start
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Installation and basic configuration</p>
        </Link>
        <Link href="/docs/concepts" className="group p-5 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md bg-white dark:bg-slate-800/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            Core Concepts
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Understand architecture and design</p>
        </Link>
        <Link href="/api-examples" className="group p-5 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md bg-white dark:bg-slate-800/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            API Examples
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Practical code examples</p>
        </Link>
        <Link href="/docs/guides/best-practices" className="group p-5 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-md bg-white dark:bg-slate-800/50">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            Best Practices
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">Production environment recommendations</p>
        </Link>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between mt-16 pt-8 border-t border-gray-200 dark:border-slate-700">
        <div></div>
        <Link href="/docs/getting-started" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium group">
          Next: Quick Start
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </>
  );
}
