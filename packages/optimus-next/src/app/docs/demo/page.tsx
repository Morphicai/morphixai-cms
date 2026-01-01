'use client';

import React, { useState } from 'react';
import { 
  DocLayout, 
  ApiGroup, 
  AdvancedSearch, 
  SearchResults, 
  SearchService 
} from '../../../components/docs';
import { sampleDocSections } from '../../../components/docs/sampleData';
import { sampleApiEndpoints } from '../../../components/docs/api/sampleData';
import { sampleSearchIndex } from '../../../components/docs/search/sampleData';
import { SearchOptions, SearchResult, SearchStats } from '../../../components/docs/search/types';

export default function DocsDemoPage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStats, setSearchStats] = useState<SearchStats>({
    totalResults: 0,
    searchTime: 0,
    suggestions: [],
    filters: [],
  });
  const [currentQuery, setCurrentQuery] = useState('');

  // Initialize search service
  const searchService = new SearchService(sampleSearchIndex);

  // Handle search
  const handleSearch = async (options: SearchOptions) => {
    const result = await searchService.search(options);
    setSearchResults(result.results);
    setSearchStats(result.stats);
    setCurrentQuery(options.query);
    return result;
  };

  // Handle DocLayout search (simplified version)
  const handleDocLayoutSearch = async (query: string) => {
    const result = await searchService.search({ query });
    return result.results.map(r => ({
      id: r.id,
      title: r.title,
      path: r.path,
      type: r.type,
      excerpt: r.excerpt,
      section: r.section,
    }));
  };
  const handleSuggestion = async (query: string) => {
    return await searchService.getSuggestions(query);
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    console.log('Search result clicked:', result);
    // Navigate to corresponding page here
  };

  // Handle filter changes
  const handleFilterChange = (filters: Record<string, string[]>) => {
    console.log('Filters changed:', filters);
    // Re-search here
  };

  const breadcrumbs = [
    { title: 'Home', path: '/' },
    { title: 'Documentation', path: '/docs' },
    { title: 'Component Demo', path: '/docs/demo' },
  ];

  return (
    <DocLayout
      sections={sampleDocSections}
      breadcrumbs={breadcrumbs}
      currentPath="/docs/demo"
      onSearch={handleDocLayoutSearch}
    >
      <div className="space-y-12">
        {/* Page Title */}
        <header>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Documentation Center Component Demo
          </h1>
          <p className="text-xl text-muted-foreground">
            Showcasing the complete functionality of document navigation, API documentation, search features, and more
          </p>
        </header>

        {/* Advanced Search Demo */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Advanced Search Features
          </h2>
          <div className="space-y-6">
            <AdvancedSearch
              onSearch={handleSearch}
              onSuggestion={handleSuggestion}
            />
            
            {searchResults.length > 0 && (
              <SearchResults
                results={searchResults}
                stats={searchStats}
                query={currentQuery}
                onResultClick={handleResultClick}
                onFilterChange={handleFilterChange}
              />
            )}
          </div>
        </section>

        {/* API Documentation Demo */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            API Documentation Display
          </h2>
          <ApiGroup
            title="User Authentication API"
            description="API endpoints related to user registration, login, and authentication"
            endpoints={sampleApiEndpoints}
            showExamples={true}
            interactive={true}
          />
        </section>

        {/* Feature Description */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                📚 Smart Navigation
              </h3>
              <p className="text-muted-foreground text-sm">
                Supports tree structure navigation, auto-expands current page path, with search and filter capabilities
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                🔍 Full-Text Search
              </h3>
              <p className="text-muted-foreground text-sm">
                Real-time search suggestions, highlighted results, supports multi-dimensional filtering by type, category, etc.
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                🛠️ API Documentation
              </h3>
              <p className="text-muted-foreground text-sm">
                Interactive API documentation, supports online testing, multi-language code example generation
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                🎨 Responsive Design
              </h3>
              <p className="text-muted-foreground text-sm">
                Fully responsive layout, supports mobile and desktop, dark mode adapted
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                ⚡ High Performance
              </h3>
              <p className="text-muted-foreground text-sm">
                Component lazy loading, search debouncing, cache optimization, ensuring smooth user experience
              </p>
            </div>

            <div className="border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                🔧 Customizable
              </h3>
              <p className="text-muted-foreground text-sm">
                Flexible component configuration, supports custom styling, extensible plugin system
              </p>
            </div>
          </div>
        </section>

        {/* Usage Instructions */}
        <section>
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Usage Instructions
          </h2>
          
          <div className="bg-muted rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Quick Start
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">1. Import Components</h4>
                <pre className="bg-background border border-border rounded p-3 overflow-x-auto">
{`import { 
  DocLayout, 
  DocNavigation, 
  ApiGroup, 
  AdvancedSearch 
} from '@/components/docs';`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">2. Configure Data</h4>
                <pre className="bg-background border border-border rounded p-3 overflow-x-auto">
{`const sections = [
  {
    id: 'getting-started',
    title: 'Quick Start',
    path: '/docs/getting-started',
    children: [...]
  }
];`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">3. Use Components</h4>
                <pre className="bg-background border border-border rounded p-3 overflow-x-auto">
{`<DocLayout
  sections={sections}
  breadcrumbs={breadcrumbs}
  currentPath="/docs/demo"
>
  {/* Page content */}
</DocLayout>`}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}