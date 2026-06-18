'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Solo letras, números, puntos y guiones bajos'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [globalErr, setGlobalErr] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pwd = watch('password', '');
  const pwdStrength = pwd.length === 0 ? 0 : pwd.length < 8 ? 1 : pwd.match(/[A-Z]/) && pwd.match(/[0-9]/) ? 3 : 2;
  const strengthLabel = ['', 'Débil', 'Regular', 'Fuerte'];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-400'];

  const onSubmit = async (data: FormData) => {
    setGlobalErr('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setGlobalErr(json.error || 'Error al crear la cuenta');
      return;
    }
    setSuccess(true);
    await signIn('credentials', { email: data.email, password: data.password, redirect: false });
    router.push('/');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center gap-4">
        <CheckCircle2 size={64} className="text-green-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">¡Cuenta creada!</h2>
        <p className="text-gray-500">Iniciando sesión...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black gradient-text tracking-tight">HypeX</h1>
        <p className="text-sm text-gray-400 mt-2">Crea tu cuenta y únete a la comunidad</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-3">
        {globalErr && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 text-center">
            {globalErr}
          </div>
        )}

        {[
          { name: 'name' as const, placeholder: 'Nombre completo', type: 'text', autoComplete: 'name' },
          { name: 'username' as const, placeholder: 'Nombre de usuario', type: 'text', autoComplete: 'username' },
          { name: 'email' as const, placeholder: 'Correo electrónico', type: 'email', autoComplete: 'email' },
        ].map(field => (
          <div key={field.name}>
            <input
              {...register(field.name)}
              type={field.type}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
            />
            {errors[field.name] && (
              <p className="text-red-500 text-xs mt-1 pl-1">{errors[field.name]?.message}</p>
            )}
          </div>
        ))}

        {/* Password */}
        <div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPwd ? 'text' : 'password'}
              placeholder="Contraseña"
              autoComplete="new-password"
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors pr-12"
            />
            <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength indicator */}
          {pwd.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwdStrength ? strengthColor[pwdStrength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
              </div>
              <span className="text-xs text-gray-500">{strengthLabel[pwdStrength]}</span>
            </div>
          )}
          {errors.password && <p className="text-red-500 text-xs mt-1 pl-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-semibold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none mt-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Crear cuenta
        </button>

        <p className="text-[11px] text-gray-400 text-center pt-1">
          Al registrarte aceptas nuestros{' '}
          <Link href="/terms" className="text-blue-500">Términos</Link>{' '}y{' '}
          <Link href="/privacy" className="text-blue-500">Política de privacidad</Link>
        </p>
      </form>

      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-blue-500 font-semibold">Inicia sesión</Link>
      </p>
    </div>
  );
}
