'use client';

import { usePathname } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDocsPage = pathname?.startsWith('/docs');

  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {!isDocsPage && <Footer />}
    </>
  );
}

