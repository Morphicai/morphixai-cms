import Link from 'next/link';
import { Zap, Layout, FileText, Link2, Edit3, Users, Code2, Shield, Gauge, Database, Building2, Briefcase, Sparkles, Key, Workflow, Puzzle, Boxes, CreditCard } from 'lucide-react';
import { Hero, FeatureGrid, StatsSection } from '../components/marketing';
import { Button } from '../components/Button';

export default function Home() {
  // Statistics
  const stats = [
    { id: '1', value: '10K+', label: 'Developers' },
    { id: '2', value: '100+', label: 'Enterprise Clients' },
    { id: '3', value: '99.9', suffix: '%', label: 'Service Availability' },
    { id: '4', value: '24/7', label: 'Technical Support' },
  ];

  // Core features
  const coreFeatures = [
    {
      id: 'ai-driven',
      icon: <Zap className="w-12 h-12" />,
      title: 'AI-Driven CMS',
      description: 'Leverage AI technology to automatically generate pages, modules, and content. Provides intelligent content recommendations and code assistance to significantly improve development efficiency.',
    },
    {
      id: 'micro-frontend',
      icon: <Layout className="w-12 h-12" />,
      title: 'Micro-Frontend Architecture',
      description: 'Support modular development with unified base management. Support dynamic loading and hot-swapping for more efficient team collaboration.',
    },
    {
      id: 'dynamic-content',
      icon: <FileText className="w-12 h-12" />,
      title: 'Dynamic Content Center',
      description: 'Backend configurable content management system supporting multiple content types including text, HTML, images, and links. Works with React components to separate content from presentation.',
    },
    {
      id: 'short-link',
      icon: <Link2 className="w-12 h-12" />,
      title: 'Short Link System',
      description: 'Built-in short link and short token support. Provides URL shortening, access statistics, QR code generation, and more. Suitable for marketing and temporary authorization scenarios.',
    },
    {
      id: 'visual-editor',
      icon: <Edit3 className="w-12 h-12" />,
      title: 'Visual Editor',
      description: 'Drag-and-drop page builder integrated with dynamic content and short link system. Built-in React component library allows non-technical staff to quickly create pages.',
    },
    {
      id: 'roundtable',
      icon: <Users className="w-12 h-12" />,
      title: 'Roundtable Development',
      description: 'Expose key interfaces through SDK, support third-party developers to extend functionality while protecting core code. Enable a secure ecosystem.',
    },
  ];

  // Technical advantages
  const techFeatures = [
    {
      id: 'tech-1',
      icon: <Code2 className="w-10 h-10" />,
      title: 'Modern Tech Stack',
      description: 'NestJS + React + Next.js + TypeScript with Monorepo architecture and complete type safety.',
    },
    {
      id: 'tech-2',
      icon: <Shield className="w-10 h-10" />,
      title: 'Enterprise-Grade Security',
      description: 'JWT authentication, RBAC permission control, data encryption, and audit logs to meet enterprise security compliance requirements.',
    },
    {
      id: 'tech-3',
      icon: <Gauge className="w-10 h-10" />,
      title: 'High-Performance Architecture',
      description: 'Event-driven architecture, cache optimization, request deduplication, and CDN acceleration ensure efficient and stable system operation.',
    },
    {
      id: 'tech-4',
      icon: <Database className="w-10 h-10" />,
      title: 'Flexible Data Storage',
      description: 'Support for MySQL and PostgreSQL. Integrated with Aliyun OSS/MinIO for file storage. Easy to scale.',
    },
  ];

  // Future features
  const futureFeatures = [
    {
      id: 'future-1',
      icon: <Sparkles className="w-10 h-10" />,
      title: 'AI Low-Code/No-Code',
      description: 'AI-powered visual development platform enabling rapid application building with minimal coding. Intelligent component generation and workflow automation.',
      status: 'Coming Soon',
    },
    {
      id: 'future-2',
      icon: <Key className="w-10 h-10" />,
      title: 'Third-Party Auth Integration',
      description: 'Seamless integration with Supabase, Auth0, Firebase, and other leading authentication providers for flexible identity management.',
      status: 'Coming Soon',
    },
    {
      id: 'future-3',
      icon: <Workflow className="w-10 h-10" />,
      title: 'N8N Workflow Automation',
      description: 'Built-in N8N integration for powerful workflow automation, data synchronization, and business process orchestration.',
      status: 'Coming Soon',
    },
    {
      id: 'future-4',
      icon: <Puzzle className="w-10 h-10" />,
      title: 'MCP Protocol Support',
      description: 'Support for Model Context Protocol (MCP) enabling advanced AI model integration and context-aware intelligent features.',
      status: 'Coming Soon',
    },
    {
      id: 'future-5',
      icon: <Boxes className="w-10 h-10" />,
      title: 'Strapi Integration',
      description: 'Compatible with Strapi headless CMS for flexible content management and API-first architecture.',
      status: 'Coming Soon',
    },
    {
      id: 'future-6',
      icon: <CreditCard className="w-10 h-10" />,
      title: 'Stripe Payment Integration',
      description: 'Full-featured Stripe integration for subscriptions, one-time payments, invoicing, and comprehensive payment management.',
      status: 'Coming Soon',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero
        variant="centered"
        ctaPrimaryText="Get Started"
        ctaPrimaryHref="/docs/getting-started"
        ctaSecondaryText="View Docs"
        ctaSecondaryHref="/docs"
      />

      {/* Statistics */}
      <StatsSection stats={stats} />

      {/* Core Features */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Powerful Core Features
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Optimus CMS provides a complete modern content management solution to help enterprises quickly build and manage digital applications
            </p>
          </div>
          
          <FeatureGrid
            features={coreFeatures}
            columns={3}
            variant="card"
          />
        </div>
      </section>

      {/* Technical Advantages */}
      <section className="py-24 sm:py-32 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Technical Advantages
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Using industry-leading technology stack and architecture design to ensure system stability, security, and scalability
            </p>
          </div>
          
          <FeatureGrid
            features={techFeatures}
            columns={4}
            variant="default"
          />
        </div>
      </section>

      {/* Future Features */}
      <section className="py-24 sm:py-32 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm mb-6">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Future Roadmap</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Upcoming Features
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              We're constantly innovating to bring you the most advanced CMS capabilities. Here's what's coming next
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {futureFeatures.map((feature) => (
              <div 
                key={feature.id} 
                className="relative group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-100 hover:border-indigo-200"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm">
                    {feature.status}
                  </span>
                </div>
                
                {/* Icon */}
                <div className="mb-6 text-indigo-600 group-hover:text-indigo-700 transition-colors">
                  {feature.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-neutral-900 mb-3 pr-20">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
          
          {/* Additional CTA */}
          <div className="mt-16 text-center">
            <p className="text-lg text-neutral-600 mb-6">
              Want to suggest a feature or stay updated on our roadmap?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="min-w-[200px] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-lg">
                  Share Your Ideas
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="outline" size="lg" className="min-w-[200px] border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-full">
                  View Roadmap
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              Use Cases
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Whether you're a startup or a large enterprise, Optimus CMS can meet your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Developers */}
            <div className="flex flex-col p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Code2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Independent Developers</h3>
              <p className="text-neutral-600 leading-relaxed text-sm">
                Quick project startup with rich SDK and component library. Focus on business logic development and save time
              </p>
            </div>

            {/* Small Businesses */}
            <div className="flex flex-col p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Small to Medium Businesses</h3>
              <p className="text-neutral-600 leading-relaxed text-sm">
                Complete enterprise-level features. Visual editor lowers the barrier to entry. Flexible expansion capability grows with your business
              </p>
            </div>

            {/* Large Enterprises */}
            <div className="flex flex-col p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl h-full">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Large Enterprises</h3>
              <p className="text-neutral-600 leading-relaxed text-sm">
                Micro-frontend architecture supports team collaboration. Enterprise-grade security. Roundtable paradigm supports ecosystem building
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#3576f6]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Contact us now for professional technical consultation and solutions
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="min-w-[180px] bg-white text-[#3576f6] hover:bg-gray-50 rounded-full shadow-xl">
                Contact Us
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="min-w-[180px] bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
