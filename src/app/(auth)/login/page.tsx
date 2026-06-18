'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }
    router.push('/');
    router.refresh();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            HypeX
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Inicia sesión en tu cuenta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <input
              {...register('email')}
              type="email"
              placeholder="Email"
              autoComplete="email"
              className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-900 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 px-1">{errors.email.message}</p>}
          </div>

          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Contraseña"
              autoComplete="current-password"
              className="w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-900 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
            />
            <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <p className="text-xs text-red-500 mt-1 px-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Iniciar sesión
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
          <span className="text-xs text-gray-400">o</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-3.5 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="font-semibold text-purple-500">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
