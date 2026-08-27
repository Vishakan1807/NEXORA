import type { Metadata } from 'next';
import './globals.css';
import './components.css';
import './layout.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'NEXORA — AI Engineering & Orchestration Platform',
  description:
    'Next-generation AI engineering platform for software analysis, testing, security, performance, and production readiness evaluation.',
  keywords: [
    'AI engineering',
    'software quality',
    'code analysis',
    'QA platform',
    'security analysis',
    'production readiness',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="eclipse" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
