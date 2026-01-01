import Link from 'next/link';
import { Container, Grid } from '../../design-system';
import { Button } from '../Button';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Products',
      links: [
        { name: 'API Services', href: '/api-examples' },
        { name: 'Business Demo', href: '/business-demo' },
        { name: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '/docs' },
        { name: 'API Reference', href: '/docs/api' },
        { name: 'Getting Started', href: '/docs/getting-started' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Contact Us', href: '/contact' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'News', href: '/news' },
      ],
    },
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      )
    },
    {
      name: 'Twitter',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    },
    {
      name: 'WeChat',
      href: '#',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.099 4.203 2.895 5.511L2.187 17.69l2.831-1.416c.873.278 1.814.464 2.815.464.304 0 .603-.016.898-.043-.187-.623-.291-1.283-.291-1.968 0-3.946 3.582-7.14 8-7.14.209 0 .415.006.619.017C16.445 4.264 12.906 2.188 8.691 2.188zm5.785 2.83c.48 0 .869.39.869.869s-.389.869-.869.869-.869-.39-.869-.869.389-.869.869-.869zm-5.785.869c.48 0 .869.39.869.869s-.389.869-.869.869-.869-.39-.869-.869.389-.869.869-.869zm7.056 5.238c-3.546 0-6.41 2.434-6.41 5.438 0 .304.043.598.114.885L7.691 19.64l1.773-1.416c.697.278 1.463.464 2.282.464 3.546 0 6.41-2.434 6.41-5.438s-2.864-5.438-6.41-5.438zm-2.133 2.133c.48 0 .869.39.869.869s-.389.869-.869.869-.869-.39-.869-.869.389-.869.869-.869zm4.266 0c.48 0 .869.39.869.869s-.389.869-.869.869-.869-.39-.869-.869.389-.869.869-.869z"/>
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main Content Area */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">O</span>
                </div>
                <span className="text-xl font-bold">Optimus</span>
              </Link>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-xs">
                Modern Enterprise Solutions Platform
              </p>
              
              {/* Social Media Links */}
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-neutral-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-neutral-800"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-white font-semibold mb-3 text-sm">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-neutral-400 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-neutral-800 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
            <p>© {currentYear} Optimus. All rights reserved.</p>
            
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}