'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const docSections = [
    {
      title: 'Getting Started',
      items: [
        { title: 'Introduction', href: '/docs' },
        { title: 'Quick Start', href: '/docs/getting-started' },
        { title: 'Installation', href: '/docs/installation' },
        { title: 'Core Concepts', href: '/docs/concepts' },
      ],
    },
    {
      title: 'API Reference',
      items: [
        { title: 'Authentication', href: '/docs/api/auth' },
        { title: 'User Management', href: '/docs/api/users' },
        { title: 'Data Operations', href: '/docs/api/data' },
        { title: 'Error Handling', href: '/docs/api/errors' },
      ],
    },
    {
      title: 'Guides',
      items: [
        { title: 'Best Practices', href: '/docs/guides/best-practices' },
        { title: 'Security', href: '/docs/guides/security' },
        { title: 'Performance', href: '/docs/guides/performance' },
        { title: 'Deployment', href: '/docs/guides/deployment' },
      ],
    },
    {
      title: 'Examples',
      items: [
        { title: 'Basic Usage', href: '/docs/examples/basic' },
        { title: 'Advanced Features', href: '/docs/examples/advanced' },
        { title: 'Integration Cases', href: '/docs/examples/integrations' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 top-20 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex h-full">
        {/* Left Sidebar - Independent Scroll */}
        <aside
          className={`
            h-full flex-shrink-0
            bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700
            overflow-y-auto transition-all duration-300 ease-in-out z-30
            ${sidebarCollapsed ? 'w-0' : 'w-64 lg:w-72'}
          `}
        >
          {/* Navigation */}
          <nav className={`py-8 px-6 space-y-8 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
            {docSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block px-3 py-1.5 rounded-md text-[14px] transition-colors ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`
            absolute top-4 z-40 p-2 rounded-r-lg bg-white dark:bg-slate-800 
            border border-l-0 border-gray-200 dark:border-slate-700
            hover:bg-gray-50 dark:hover:bg-slate-700 transition-all
            ${sidebarCollapsed ? 'left-0' : 'left-64 lg:left-72'}
          `}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg
            className={`w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform ${
              sidebarCollapsed ? '' : 'rotate-180'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Right Content Area - Independent Scroll */}
        <div className="flex-1 h-full overflow-y-auto">
          <div className="flex max-w-[1600px] mx-auto min-h-full">
            {/* Center Content */}
            <main className="flex-1 min-w-0 px-6 sm:px-8 lg:px-12 py-12">
              {children}
            </main>

            {/* Right Sidebar - Table of Contents */}
            <aside className="hidden xl:block w-64 py-12 pr-8 flex-shrink-0">
              <div className="sticky top-12">
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">
                  On This Page
                </h4>
                <nav className="text-sm">
                  <div className="space-y-2 text-slate-600 dark:text-slate-400 text-[13px]">
                    <p className="text-xs italic">Table of contents will be auto-generated based on page content</p>
                  </div>
                </nav>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
