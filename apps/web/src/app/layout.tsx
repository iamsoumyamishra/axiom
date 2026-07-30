import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../features/auth/AuthContext';
import { Toaster } from '../components/ui/sonner';

export const metadata: Metadata = {
  title: 'Axiom',
  description: 'AI-powered knowledge platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
