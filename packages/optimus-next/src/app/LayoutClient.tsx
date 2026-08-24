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
  // 嵌入形态页面(被 zone/子应用 iframe 弹层加载),不渲染整站页头页脚
  const isEmbedPage = pathname?.startsWith('/auth/login-embed');

  if (isEmbedPage) {
    return <main>{children}</main>;
  }

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

