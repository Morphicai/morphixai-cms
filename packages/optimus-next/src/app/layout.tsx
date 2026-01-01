import type { Metadata } from "next";
import "./globals.css";
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { AuthProvider } from '../components/auth/AuthProvider';
import { ThemeProvider } from '../design-system';
import LayoutClient from './LayoutClient';

// 获取网站 URL，优先使用环境变量，否则使用默认值
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
const siteName = 'Optimus';
const siteDescription = 'Providing efficient and reliable modern solutions for developers and enterprises, including API services, business demos, documentation center, and more.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Modern Enterprise Solutions Platform`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Optimus',
    'API',
    'Enterprise Solutions',
    'Developer Platform',
    'Business Demo',
    'CMS',
    'Content Management System',
    'Enterprise Software',
    'Developer Tools',
  ],
  authors: [{ name: 'Optimus Team' }],
  creator: 'Optimus',
  publisher: 'Optimus',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - Modern Enterprise Solutions Platform`,
    description: siteDescription,
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: `${siteName} Logo`,
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Modern Enterprise Solutions Platform`,
    description: siteDescription,
    images: ['/logo.svg'],
    creator: '@optimus',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // 可以在这里添加 Google Search Console 和 Bing 验证码
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider defaultTheme="auto" storageKey="optimus-theme">
          <AuthProvider>
            <LayoutClient>
              {children}
            </LayoutClient>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
