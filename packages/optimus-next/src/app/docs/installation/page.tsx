import Link from 'next/link';

export default function InstallationPage() {
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
            <span className="text-gray-900 dark:text-white">Installation</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Installation & Configuration
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Complete Optimus CMS installation and deployment guide to help you quickly set up development and production environments.
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {/* System Requirements */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                System Requirements
              </h2>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Required Environment</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span><strong>Node.js</strong> &gt;= 20.0.0 (recommended 20.11.0)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span><strong>pnpm</strong> &gt;= 8.15.1</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span><strong>Docker</strong> &gt;= 20.10.0 & Docker Compose &gt;= 2.0.0</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span><strong>MySQL</strong> &gt;= 8.0</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">✓</span>
                    <span><strong>Redis</strong> &gt;= 6.0</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  💡 Recommended Configuration
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  - Memory: 8GB or more<br />
                  - Storage: 20GB or more available space<br />
                  - Operating System: macOS, Linux, or Windows 10/11 (WSL2)
                </p>
              </div>
            </section>

            {/* Quick Installation */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Quick Installation
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Step 1: Clone the Project
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`git clone https://github.com/paul-leo/optimus-cms.git
cd optimus-cms`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Step 2: Install pnpm (if not installed)
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`npm install -g pnpm@8.15.1`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Step 3: Configure Environment Variables
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4 mb-3">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Configure environment variables for API project
cd packages/optimus-api
cp env.example .env.local

# Configure environment variables for Admin UI
cd ../optimus-ui
cp env.example .env.local

# Configure environment variables for Client
cd ../optimus-next
cp env.example .env.local`}
                    </pre>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      <strong>Important:</strong> Please modify the configuration items in the .env.local file according to your actual environment
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Step 4: One-Click Environment Initialization
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4 mb-3">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Return to project root directory
cd ../..

# Run environment check and initialization (auto install dependencies, start database, initialize data)
npm run doctor`}
                    </pre>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    The doctor command will automatically complete the following operations:
                  </p>
                  <ul className="text-gray-600 dark:text-gray-400 text-sm list-disc ml-6 mt-2">
                    <li>Check Node.js and pnpm versions</li>
                    <li>Install project dependencies</li>
                    <li>Start Docker containers (MySQL, Redis, MinIO)</li>
                    <li>Create database and table structures</li>
                    <li>Import initial data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Step 5: Start Development Server
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Start all services
npm run dev

# Or start separately
npm run dev:api    # Start API service (port 8084)
npm run dev:ui     # Start Admin UI (port 8082)
npm run dev:next   # Start Client (port 8086)`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Environment Variables Configuration */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Environment Variables Details
              </h2>

              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    1. API Service Configuration (packages/optimus-api/.env.local)
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-sm mb-3">
                    <pre className="text-gray-800 dark:text-gray-200">
{`# Application Configuration
APP_PORT=8084
APP_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=optimus_cms

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Client User Authentication Secret
CLIENT_USER_SECRET=your_client_secret_key

# File Storage Configuration (MinIO/Aliyun OSS)
OSS_TYPE=minio  # minio or aliyun
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin  # MinIO 默认访问密钥（生产环境请修改）
MINIO_SECRET_KEY=minioadmin  # MinIO 默认密钥（生产环境请修改）
MINIO_BUCKET=optimus-cms

# Aliyun OSS (if using)
# ALIYUN_OSS_ACCESS_KEY_ID=
# ALIYUN_OSS_ACCESS_KEY_SECRET=
# ALIYUN_OSS_BUCKET=
# ALIYUN_OSS_REGION=

# Logging Configuration
LOG_LEVEL=debug  # Change to info in production

# Sentry Monitoring (optional)
# SENTRY_DSN=`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    2. Admin UI Configuration (packages/optimus-ui/.env.local)
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-sm mb-3">
                    <pre className="text-gray-800 dark:text-gray-200">
{`# API Service URL
REACT_APP_API_BASE_URL=http://localhost:8084

# Application Port
PORT=8082

# Upload File Size Limit (MB)
REACT_APP_MAX_FILE_SIZE=10`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    3. Client Configuration (packages/optimus-next/.env.local)
                  </h3>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-sm mb-3">
                    <pre className="text-gray-800 dark:text-gray-200">
{`# API Service URL (for client)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8084

# Application Port
PORT=8086

# Client User Authentication Secret (must match API service)
NEXT_PUBLIC_CLIENT_USER_SECRET=your_client_secret_key

# Site Information
NEXT_PUBLIC_SITE_NAME=Optimus CMS
NEXT_PUBLIC_SITE_URL=http://localhost:8086`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Manual Database Initialization */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Manual Database Initialization
              </h2>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If `npm run doctor` fails to initialize the database automatically, you can manually execute the following steps:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    1. Start Database Service
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`docker-compose -f docker-compose.local.yml up -d`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    2. Import Database Structure
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Use provided SQL file
mysql -h localhost -u root -p optimus_cms < packages/optimus-api/db/optimus-minimal.sql`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    3. (Optional) Import Test Data
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`mysql -h localhost -u root -p optimus_cms < packages/optimus-api/db/seeds/test-data.sql`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Access Application */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Access Application
              </h2>

              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    🔐 Admin Dashboard
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Access URL: <a href="http://localhost:8082" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">http://localhost:8082</a>
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">Default admin account:</p>
                    <p className="text-gray-700 dark:text-gray-300">Username: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">admin</code></p>
                    <p className="text-gray-700 dark:text-gray-300">Password: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">请查看数据库种子数据或联系管理员</code></p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-2">⚠️ 注意：默认密码应在首次登录后立即修改</p>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    🌐 Client Frontend
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    Access URL: <a href="http://localhost:8086" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">http://localhost:8086</a>
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    📡 API Service
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    API URL: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">http://localhost:8084</code>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">
                    Health Check: <a href="http://localhost:8084/health" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">http://localhost:8084/health</a>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    API Docs: <a href="http://localhost:8084/api/docs" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">http://localhost:8084/api/docs</a> (if enabled)
                  </p>
                </div>
              </div>
            </section>

            {/* Docker Deployment */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Docker Production Deployment
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Build Docker Image
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`# Build API service image
docker build -t optimus-api:latest -f Dockerfile .

# Build frontend image (if needed)
docker build -t optimus-next:latest -f packages/optimus-next/Dockerfile packages/optimus-next`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Start with Docker Compose
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`docker-compose up -d`}
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                FAQ
              </h2>

              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Q: What if the port is already in use?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    A: You can modify the port number in the .env.local file of each project, or close the process occupying the port.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Q: Database connection failed?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    A: Ensure Docker containers are running normally (`docker ps`), check if the database configuration in .env.local is correct.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Q: pnpm dependency installation failed?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    A: Try clearing the cache: `pnpm store prune`, then reinstall: `pnpm install`
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Q: How to reset the database?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    A: Delete the database and re-import the SQL file, or run `npm run db:reset` (if this command is available).
                  </p>
                </div>
              </div>
            </section>

            {/* Next Steps */}
            <section>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Next Steps
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Congratulations! You have successfully installed Optimus CMS. Now you can:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/docs/getting-started"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Quick Start →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Start using platform features</p>
                    </div>
                  </Link>

                  <Link
                    href="/docs/concepts"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Core Concepts →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Understand architecture and design</p>
                    </div>
                  </Link>

                  <Link
                    href="/api-examples"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">API Examples →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">View API call examples</p>
                    </div>
                  </Link>

                  <Link
                    href="/docs/guides/best-practices"
                    className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Best Practices →</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Development recommendations and standards</p>
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
