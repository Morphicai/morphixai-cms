'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Rocket, Megaphone, Briefcase, Palette, Settings, Target, Hospital, Building2, ShoppingCart, GraduationCap, Home, Truck, Utensils, Plane } from 'lucide-react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export default function UseCasesPage() {
  const [activeTab, setActiveTab] = useState('all');

  const useCases = [
    {
      category: 'founders',
      Icon: Rocket,
      title: 'Entrepreneurs & Founders',
      description: 'Quickly validate ideas, build MVPs, manage early users',
      color: 'from-[#3576f6] to-[#5c8df7]',
      bgColor: 'from-[#e3ecfd] to-[#f0f4ff]',
      features: [
        'Rapid prototyping',
        'User feedback collection',
        'Data analytics dashboard',
        'Team collaboration tools',
      ],
    },
    {
      category: 'marketing',
      Icon: Megaphone,
      title: 'Marketing Teams',
      description: 'Automate marketing processes, improve conversion rates, optimize user experience',
      color: 'from-[#10b981] to-[#34d399]',
      bgColor: 'from-emerald-50 to-teal-50',
      features: [
        'Campaign management',
        'User behavior tracking',
        'A/B testing tools',
        'Conversion rate optimization',
      ],
    },
    {
      category: 'sales',
      Icon: Briefcase,
      title: 'Sales Teams',
      description: 'CRM integration, sales process automation, customer relationship management',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      features: [
        'Sales funnel management',
        'Customer follow-up reminders',
        'Contract management',
        'Performance analytics reports',
      ],
    },
    {
      category: 'product',
      Icon: Palette,
      title: 'Product Teams',
      description: 'User research, feature planning, product iteration, data-driven decisions',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      features: [
        'User feedback management',
        'Feature request tracking',
        'Product roadmap',
        'Usage data analysis',
      ],
    },
    {
      category: 'engineering',
      Icon: Settings,
      title: 'Engineering Teams',
      description: 'API management, tech stack integration, development efficiency improvement',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'from-cyan-50 to-blue-50',
      features: [
        'API documentation generation',
        'Development environment setup',
        'Automated testing',
        'Performance monitoring',
      ],
    },
    {
      category: 'support',
      Icon: Target,
      title: 'Customer Support',
      description: 'Ticketing system, knowledge base, customer satisfaction tracking',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-50 to-purple-50',
      features: [
        'Smart ticketing system',
        'Knowledge base management',
        'Customer satisfaction surveys',
        'Multi-channel support',
      ],
    },
  ];

  const tabs = [
    { id: 'all', label: 'All Use Cases' },
    { id: 'founders', label: 'Founders' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'sales', label: 'Sales' },
    { id: 'product', label: 'Product' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'support', label: 'Support' },
  ];

  const filteredUseCases = activeTab === 'all' 
    ? useCases 
    : useCases.filter(uc => uc.category === activeTab);

  return (
    <div className="min-h-screen bg-[#e8eaf4] dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#3576f6]/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-[#10b981]/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-white/50 mb-8">
              <span className="text-sm font-medium text-slate-700">
                💡 Use Cases
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black mb-8">
              Tailored Solutions
              <span className="block mt-2">for Every Team</span>
            </h1>
            
            <p className="text-xl text-slate-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              From startups to mature enterprises, from technology to business, Optimus provides professional tools and services for different roles
            </p>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="py-8 bg-white/50 backdrop-blur-sm sticky top-20 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#3576f6] text-white shadow-lg shadow-[#3576f6]/30'
                    : 'bg-white text-slate-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredUseCases.map((useCase, index) => {
              const Icon = useCase.Icon;
              return (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden bg-gradient-to-br ${useCase.bgColor} border-transparent p-8 hover:shadow-2xl transition-all duration-300 group`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full blur-2xl"
                       style={{backgroundImage: `linear-gradient(135deg, currentColor, transparent)`}}></div>
                  
                  <div className="relative">
                    <div className={`w-16 h-16 bg-gradient-to-br ${useCase.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-black mb-3">
                      {useCase.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      {useCase.description}
                    </p>
                    
                    <div className="space-y-2 mb-6">
                      {useCase.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start">
                          <svg className="w-5 h-5 text-[#10b981] mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Link 
                      href="/contact" 
                      className="inline-flex items-center text-[#3576f6] hover:text-[#2d6ef5] font-semibold group-hover:translate-x-1 transition-transform"
                    >
                      Learn More
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              Industry Solutions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Customized solutions tailored to specific industry needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: Hospital, name: 'Healthcare', desc: 'Patient management, appointment systems' },
              { Icon: Building2, name: 'Fintech', desc: 'Risk control, payment integration' },
              { Icon: ShoppingCart, name: 'E-commerce', desc: 'Inventory management, order processing' },
              { Icon: GraduationCap, name: 'Online Education', desc: 'Course management, student tracking' },
              { Icon: Home, name: 'Real Estate', desc: 'Property management, client follow-up' },
              { Icon: Truck, name: 'Logistics', desc: 'Dispatch systems, route optimization' },
              { Icon: Utensils, name: 'Food Service', desc: 'Ordering systems, membership management' },
              { Icon: Plane, name: 'Travel & Hospitality', desc: 'Booking systems, room management' },
            ].map((industry, index) => {
              const Icon = industry.Icon;
              return (
                <Card key={index} className="p-6 bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:shadow-lg transition-shadow text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#3576f6] to-[#10b981] rounded-xl flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-black dark:text-white mb-2">{industry.name}</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{industry.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-[#e8eaf4] dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black dark:text-white mb-4">
              Customer Success Stories
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              See how other companies use Optimus to achieve business growth
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                company: 'Tech Startup A',
                metric: '3x',
                description: 'Development efficiency improvement',
                quote: 'Optimus helped us complete in 2 months what would have taken 6 months.',
              },
              {
                company: 'E-commerce Platform B',
                metric: '50%',
                description: 'Operating cost reduction',
                quote: 'Automation processes allow our team to focus on more valuable work.',
              },
              {
                company: 'Education Institution C',
                metric: '10K+',
                description: 'User growth',
                quote: 'The powerful user management system helped us scale our business quickly.',
              },
            ].map((story, index) => (
              <Card key={index} className="p-8 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <div className="text-5xl font-bold text-[#3576f6] mb-2">{story.metric}</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">{story.description}</div>
                <p className="text-slate-700 dark:text-slate-300 mb-4 italic">"{story.quote}"</p>
                <div className="text-sm font-semibold text-black dark:text-white">— {story.company}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#3576f6]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Find the Right Solution for You
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Let our expert team tailor the best solution for you
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="min-w-[180px] bg-white text-[#3576f6] hover:bg-gray-50 rounded-full shadow-xl">
                Book Consultation
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
