'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Camera } from 'lucide-react';
import { useSession } from 'next-auth/react';
import TopBar from '@/components/layout/TopBar';
import Avatar from '@/components/ui/Avatar';
import ImageUploader from '@/components/ui/ImageUploader';
import type { Session } from 'next-auth';

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(50),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_.]+$/, 'Solo letras minúsculas, números, _ y .'),
  bio: z.string().max(150).optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  user: Session['user'];
}

export default function EditProfilePage({ user }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [avatarUrl, setAvatarUrl] = useState(user?.image || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || '',
      username: (user as any)?.username || '',
      bio: '',
      website: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image: avatarUrl || undefined }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Error al guardar');
        return;
      }
      await update();
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar
        title="Editar perfil"
        showBack
        right={
          <button
            form="edit-form"
            type="submit"
            disabled={isSaving}
            className="text-blue-500 font-semibold text-sm disabled:opacity-50 flex items-center gap-1 pr-1"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </button>
        }
      />

      <form id="edit-form" onSubmit={handleSubmit(onSubmit)} className="pt-16 px-4 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <Avatar src={avatarUrl || user?.image} alt={user?.name || ''} size="2xl" />
            <ImageUploader
              onUpload={url => setAvatarUrl(url)}
              folder="avatars"
              accept="image/*"
              className="absolute inset-0"
            >
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-black cursor-pointer">
                <Camera size={14} className="text-white" />
              </div>
            </ImageUploader>
          </div>
          <p className="mt-2 text-sm text-blue-500 font-medium">Cambiar foto</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {[
          { name: 'name' as const, label: 'Nombre', placeholder: 'Tu nombre completo' },
          { name: 'username' as const, label: 'Nombre de usuario', placeholder: 'username', prefix: '@' },
          { name: 'bio' as const, label: 'Biografía', placeholder: 'Cuéntanos sobre ti...', multiline: true },
          { name: 'website' as const, label: 'Sitio web', placeholder: 'https://tu-sitio.com' },
        ].map(({ name, label, placeholder, prefix, multiline }) => (
          <div key={name}>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {label}
            </label>
            <div className="mt-1 flex items-center border-b border-gray-200 dark:border-gray-700 pb-1">
              {prefix && <span className="text-gray-400 mr-1">{prefix}</span>}
              {multiline ? (
                <textarea
                  {...register(name)}
                  placeholder={placeholder}
                  rows={3}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
                />
              ) : (
                <input
                  {...register(name)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              )}
            </div>
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>
            )}
          </div>
        ))}

        <div className="h-20" />
      </form>
    </div>
  );
}
