import Link from 'next/link';

export default function ConceptsPage() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              Home
            </Link>
            <span>/</span>
            <Link href="/docs" className="hover:text-blue-600 dark:hover:text-blue-400">
              Documentation
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Core Concepts</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Core Concepts
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Deep dive into Optimus CMS architecture design, core modules, and key concepts.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* Architecture Overview */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Six-Layer Architecture Model
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Optimus CMS adopts a six-layer architecture, from bottom-level API to top-level applications, with clear responsibilities at each layer.
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                <div className="space-y-4 text-sm">
                  <div className="flex items-start">
                    <span className="font-bold text-purple-600 mr-3">Layer 6:</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Admin Dashboard Sub-Application</span>
                      <p className="text-gray-600 dark:text-gray-400">Content management, user management, system configuration, data analytics</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-indigo-600 mr-3">Layer 5:</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">AI Generation Sub-Application</span>
                      <p className="text-gray-600 dark:text-gray-400">Page generation, module generation, component generation, code assistant</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-blue-600 mr-3">Layer 4:</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Base Application</span>
                      <p className="text-gray-600 dark:text-gray-400">Micro-frontend base, SSR, routing management, application communication</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-green-600 mr-3">Layer 3:</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">UI Component Library</span>
                      <p className="text-gray-600 dark:text-gray-400">React components, dynamic content components, business components</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-yellow-600 mr-3">Layer 2:</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">SDK Layer</span>
                      <p className="text-gray-600 dark:text-gray-400">Storage SDK, Request SDK, Business SDK, Dynamic Content SDK</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-red-600 mr-3">Layer 1:</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">API Layer</span>
                      <p className="text-gray-600 dark:text-gray-400">RESTful API, authentication, business logic, database operations</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  💡 Why Layered Architecture?
                </h4>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                  <li>• Clear separation of concerns, easy to understand and maintain</li>
                  <li>• Highly scalable, each layer can be scaled independently</li>
                  <li>• Technical flexibility, each layer can use different tech stacks</li>
                  <li>• Improved development efficiency, teams can work in parallel</li>
                </ul>
              </div>
            </section>

            {/* Core Modules */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Core Business Modules
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">👥</span>
                    Client User System
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                    <li>• User registration/login (username, email, phone)</li>
                    <li>• Third-party account binding (WeMade, Steam, Discord)</li>
                    <li>• User profile management</li>
                    <li>• Account security and permissions</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">🤝</span>
                    Partner System
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                    <li>• Multi-level referral system (supports unlimited levels)</li>
                    <li>• Team management (team statistics, hierarchical relationships)</li>
                    <li>• Channel management (referral links, channel data)</li>
                    <li>• Commission settlement and withdrawal</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">⭐</span>
                    Points Engine
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                    <li>• Task configuration (code-based config, version management)</li>
                    <li>• Points calculation (real-time calculation, multiple rules)</li>
                    <li>• Points details (complete task logs)</li>
                    <li>• Points redemption and consumption</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">📋</span>
                    External Task System
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                    <li>• Task configuration (social sharing, content creation, etc.)</li>
                    <li>• Submission review (image upload, link verification)</li>
                    <li>• Points distribution (auto-distribute after approval)</li>
                    <li>• Task statistics and reports</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">🛒</span>
                    Order System
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                    <li>• Product management (dynamic product parameters)</li>
                    <li>• Order processing (payment callbacks, status transitions)</li>
                    <li>• Order queries (multi-dimensional filtering)</li>
                    <li>• Invoice management</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <span className="text-2xl mr-2">📝</span>
                    Content Management
                  </h3>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
                    <li>• Article management (rich text, version control)</li>
                    <li>• Category and tag management</li>
                    <li>• Scheduled publishing</li>
                    <li>• SEO optimization</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Authentication Mechanism */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Authentication Mechanism
              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Optimus CMS supports multiple authentication methods to suit different scenarios:
              </p>

              <div className="space-y-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    1. ClientUserGuard Authentication (Client Users)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Used for client user authentication, employs a signature mechanism to ensure request security.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-sm">
                    <pre className="text-gray-800 dark:text-gray-200">
{`// Request headers
client-uid: user_id
client-sign: md5(uid + timestamp + secret_key)
client-timestamp: unix_timestamp`}
                    </pre>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                    <strong>Use Case:</strong> All client frontend APIs that require authentication
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    2. JWT Authentication (Admin Dashboard)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Used for admin dashboard authentication, based on JSON Web Token.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-sm">
                    <pre className="text-gray-800 dark:text-gray-200">
{`// Request headers
Authorization: Bearer <jwt_token>`}
                    </pre>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                    <strong>Use Case:</strong> All admin dashboard APIs, file uploads, etc.
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    3. Public Access (No Authentication Required)
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Some public APIs can be accessed without any authentication.
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    <strong>Use Case:</strong> User registration, public article lists, product lists, etc.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Flow */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Data Flow Process
              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Understand how a typical API request flows through the system:
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">1</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">User Action</span>
                      <p className="text-gray-600 dark:text-gray-400">User clicks a button or triggers an event in the browser</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">2</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Component Calls SDK</span>
                      <p className="text-gray-600 dark:text-gray-400">React component calls the corresponding SDK method</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">3</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">SDK Processes Request</span>
                      <p className="text-gray-600 dark:text-gray-400">SDK adds authentication info, processes parameters, sets timeout/retry</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">4</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Send HTTP Request</span>
                      <p className="text-gray-600 dark:text-gray-400">Send request to API server via Axios</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">5</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">API Receives Request</span>
                      <p className="text-gray-600 dark:text-gray-400">NestJS Controller receives and validates request</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">6</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Business Logic Processing</span>
                      <p className="text-gray-600 dark:text-gray-400">Service layer handles business logic, data validation</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">7</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Database Operations</span>
                      <p className="text-gray-600 dark:text-gray-400">Query or update MySQL database via TypeORM</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">8</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Return Response</span>
                      <p className="text-gray-600 dark:text-gray-400">Data is formatted and returned to client</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">9</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">SDK Processes Response</span>
                      <p className="text-gray-600 dark:text-gray-400">SDK caches data, handles errors, transforms format</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">10</span>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">Update UI</span>
                      <p className="text-gray-600 dark:text-gray-400">React component updates state and re-renders interface</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Event-Driven Architecture */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Event-Driven Architecture
              </h2>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Optimus CMS adopts an event-driven architecture to achieve loose coupling between modules.
              </p>

              <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 mb-6">
                <pre className="text-gray-800 dark:text-gray-200 text-sm overflow-x-auto">
{`// Publish event
eventBus.emit('partner.registered', {
  userId: '123',
  partnerCode: 'LP123456'
});

// Listen to event and handle automatically
@OnEvent('partner.registered')
async handlePartnerRegistered(event) {
  // Automatically award registration bonus points
  await pointsEngine.awardPoints(event);
  // Send welcome email
  await mailService.sendWelcomeEmail(event);
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Advantages</h4>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1">
                    <li>• Module decoupling, reduced dependencies</li>
                    <li>• Easy to extend new features</li>
                    <li>• Complete event logs</li>
                    <li>• Supports asynchronous processing</li>
                  </ul>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Common Events</h4>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1">
                    <li>• partner.registered</li>
                    <li>• user.login</li>
                    <li>• task.completed</li>
                    <li>• order.created</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Technology Stack */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Technology Stack
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Backend</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                    <li><strong>Framework:</strong> NestJS 10.x</li>
                    <li><strong>ORM:</strong> TypeORM 0.3.x</li>
                    <li><strong>Database:</strong> MySQL 8.0+</li>
                    <li><strong>Cache:</strong> Redis 6.x</li>
                    <li><strong>Storage:</strong> MinIO / Aliyun OSS</li>
                    <li><strong>Monitoring:</strong> Sentry</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Frontend</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                    <li><strong>Framework:</strong> Next.js 16 / React 19</li>
                    <li><strong>Styling:</strong> Tailwind CSS 3.x</li>
                    <li><strong>UI Library:</strong> Ant Design 5.x</li>
                    <li><strong>State Management:</strong> React Context</li>
                    <li><strong>HTTP:</strong> Axios</li>
                    <li><strong>Build:</strong> Turbopack</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">DevOps</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                    <li><strong>Containerization:</strong> Docker + Docker Compose</li>
                    <li><strong>Reverse Proxy:</strong> Caddy</li>
                    <li><strong>Package Manager:</strong> pnpm workspace</li>
                    <li><strong>Code Standards:</strong> ESLint + Prettier</li>
                  </ul>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Testing</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                    <li><strong>Unit Testing:</strong> Jest</li>
                    <li><strong>E2E Testing:</strong> Playwright</li>
                    <li><strong>API Testing:</strong> Supertest</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Continue Learning
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Link
                    href="/docs/api/auth"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">API Documentation →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Detailed API reference</p>
                    </div>
                  </Link>

                  <Link
                    href="/api-examples"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Code Examples →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Practical use cases</p>
                    </div>
                  </Link>

                  <Link
                    href="/docs/guides/best-practices"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Best Practices →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Development recommendations</p>
                    </div>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
