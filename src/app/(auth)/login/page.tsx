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
    // Sync profile to Neon (fire-and-forget, don't block navigation)
    fetch('/api/users/sync-profile', { method: 'POST' }).catch(() => {});
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
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[350px] flex flex-col gap-3">

        {/* Login card */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 px-10 pt-10 pb-8 flex flex-col items-center gap-4">

          {/* Logo */}
          <h1 className="text-5xl font-black italic bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-4 select-none tracking-tight">
            HypeX
          </h1>

          {error && (
            <div className="w-full p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-2">
            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="Número de teléfono, nombre de usuario o email"
                autoComplete="email"
                className="w-full px-3 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs font-semibold"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end mb-1">
              <Link href="/forgot-password" className="text-xs text-blue-900 dark:text-blue-400 font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold rounded text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Iniciar sesión
            </button>
          </form>

          <div className="flex items-center gap-3 w-full my-1">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs font-semibold text-gray-400 tracking-widest">O</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 text-sm font-semibold text-[#385185] dark:text-blue-400 hover:text-[#1a3a6e] dark:hover:text-blue-300 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Iniciar sesión con Google
          </button>
        </div>

        {/* Register card */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 px-10 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-[#0095f6] font-semibold">
            Regístrate
          </Link>
        </div>

        {/* App store links */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-2">
          Descarga la app para la mejor experiencia
        </p>
      </div>
    </div>
  );
}
