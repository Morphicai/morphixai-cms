import Link from 'next/link';
import type { Metadata } from 'next';
import { Shield, Zap, BarChart3, Wrench } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Explore Optimus enterprise-level solution products including CMS, API services, and developer tools.',
  openGraph: {
    title: 'Products - Optimus',
    description: 'Explore Optimus enterprise-level solution products',
    type: 'website',
  },
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-[#e8eaf4] dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#3576f6]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/50 mb-8">
              <span className="text-sm font-medium text-slate-700">
                <Zap className="w-4 h-4 inline-block mr-2" />
                Enterprise Solutions
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black mb-8">
              Powerful Product Suite
              <span className="block mt-2">Empowering Digital Transformation</span>
            </h1>
            
            <p className="text-xl text-slate-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              From API services to business management, from data analysis to intelligent decisions, Optimus provides you with full-stack solutions
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/docs/getting-started">
                <Button size="lg" className="min-w-[180px] bg-[#3576f6] hover:bg-[#2d6ef5] text-white rounded-full shadow-xl">
                  Get Started
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="min-w-[180px] bg-white hover:bg-gray-50 text-black border border-gray-200 rounded-full">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Products Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              Core Products
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Professional solutions designed for different business scenarios
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {/* API Platform */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-[#e3ecfd] to-white border-[#c3ddfd] p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#3576f6]/5 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-[#3576f6] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-black mb-4">API Platform</h3>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Complete RESTful API solution supporting user authentication, data management, business logic, and other core functions. Provides SDK and detailed documentation for more efficient development.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-[#10b981] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">RESTful API design standards</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-[#10b981] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">JWT authentication</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-[#10b981] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Complete SDK support</span>
                  </li>
                </ul>
                <Link href="/api-examples" className="inline-flex items-center text-[#3576f6] hover:text-[#2d6ef5] font-semibold">
                  Learn More
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </Card>

            {/* Business Management */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white border-emerald-100 p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-[#10b981] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold text-black mb-4">Business Management System</h3>
                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                  Comprehensive business process management system including customer management, order processing, inventory management, data analysis, and more to help enterprises improve operational efficiency.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-[#10b981] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Customer Relationship Management (CRM)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-[#10b981] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Intelligent data analysis</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-6 h-6 text-[#10b981] mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">Workflow automation</span>
                  </li>
                </ul>
                <Link href="/business-demo" className="inline-flex items-center text-[#10b981] hover:text-[#059669] font-semibold">
                  Learn More
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                Icon: Shield,
                title: 'Enterprise Security',
                description: 'Data encryption, permission management, audit logs',
              },
              {
                Icon: Zap,
                title: 'High Performance',
                description: 'Microservices design, cache optimization, load balancing',
              },
              {
                Icon: BarChart3,
                title: 'Data Insights',
                description: 'Real-time analysis, visual reports, AI predictions',
              },
              {
                Icon: Wrench,
                title: 'Flexible Customization',
                description: 'Modular design, plugin system, secondary development',
              },
            ].map((feature, index) => {
              const Icon = feature.Icon;
              return (
                <Card key={index} className="p-6 bg-white border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#3576f6] to-[#10b981] rounded-xl flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-black mb-2 text-center">{feature.title}</h4>
                  <p className="text-slate-600 text-sm text-center">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-[#e8eaf4] dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              Powerful Integration Capabilities
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Seamlessly integrate with your existing tools and services
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#3576f6] to-[#10b981] rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">Databases</h3>
              <p className="text-slate-600 dark:text-slate-300">MySQL, PostgreSQL, MongoDB, Redis</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#10b981] to-[#3576f6] rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">Cloud Services</h3>
              <p className="text-slate-600 dark:text-slate-300">AWS, Azure, Alibaba Cloud, Tencent Cloud</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">Third-Party Services</h3>
              <p className="text-slate-600 dark:text-slate-300">Payment, SMS, Email, OSS, and more</p>
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
