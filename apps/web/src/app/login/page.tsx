'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../features/auth/useAuth';
import { LoginForm } from '../../features/auth/LoginForm';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.push('/resources');
  }, [user, isLoading, router]);

  if (isLoading || user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto space-y-6 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Axiom</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
