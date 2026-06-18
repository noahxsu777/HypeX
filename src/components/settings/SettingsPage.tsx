'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  User,
  Lock,
  Bell,
  Shield,
  Eye,
  LogOut,
  Palette,
  HelpCircle,
  Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TopBar from '@/components/layout/TopBar';
import Avatar from '@/components/ui/Avatar';
import type { Profile } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sections = [
    {
      title: 'Cuenta',
      items: [
        { icon: User, label: 'Editar perfil', href: '/settings/edit-profile' },
        { icon: Lock, label: 'Cambiar contraseña', href: '/settings/password' },
        { icon: Eye, label: 'Privacidad', href: '/settings/privacy' },
      ],
    },
    {
      title: 'Notificaciones',
      items: [
        { icon: Bell, label: 'Notificaciones push', href: '/settings/notifications' },
      ],
    },
    {
      title: 'Más',
      items: [
        { icon: Palette, label: 'Apariencia', href: '/settings/appearance' },
        { icon: Shield, label: 'Seguridad', href: '/settings/security' },
        { icon: HelpCircle, label: 'Ayuda y soporte', href: '/settings/help' },
        { icon: Info, label: 'Acerca de HypeX', href: '/settings/about' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar title="Configuración" showBack />

      <div className="pt-14">
        {/* Profile summary */}
        <Link
          href="/settings/edit-profile"
          className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800"
        >
          <Avatar
            src={profile?.image}
            alt={profile?.name ?? profile?.username ?? ''}
            size="lg"
          />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              {profile?.name ?? profile?.username ?? ''}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ver tu perfil</p>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>

        {sections.map((section) => (
          <div key={section.title} className="mt-6">
            <p className="px-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {section.title}
            </p>
            <div className="bg-white dark:bg-black divide-y divide-gray-100 dark:divide-gray-800 rounded-xl mx-3 overflow-hidden shadow-sm">
              {section.items.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <Icon
                    size={20}
                    className="text-gray-500 dark:text-gray-400 flex-shrink-0"
                  />
                  <span className="flex-1 text-sm text-gray-900 dark:text-white">
                    {label}
                  </span>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <div className="mt-6 mx-3">
          <div className="bg-white dark:bg-black rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-500"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>

        <div className="mt-6 px-4 pb-8">
          <p className="text-center text-xs text-gray-400">HypeX v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
