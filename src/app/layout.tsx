import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { TopHeader } from '@/components/layout/TopHeader';

export const metadata: Metadata = {
  title: 'QuarantineCare – Hospital Operations & Patient Monitoring',
  description:
    'Dedicated clinical operations web application for virus quarantine and treatment facilities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <StoreProvider>
          <TopHeader />
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            QuarantineCare Hospital Operations MVP • FactWise Technical Product Management Assessment
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}

