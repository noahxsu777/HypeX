import { useState } from 'react';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import Avatar from '../../components/common/Avatar';
import { useStore } from '../../store/useStore';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateProfile } = useStore();
  const [form, setForm] = useState({
    displayName: currentUser.displayName,
    username: currentUser.username,
    bio: currentUser.bio,
    website: currentUser.website || '',
  });

  const handleSave = () => {
    updateProfile(form);
    navigate(-1);
  };

  const Field = ({
    label, value, onChange, multiline, placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    placeholder?: string;
  }) => (
    <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full text-sm text-gray-900 dark:text-white bg-transparent resize-none focus:outline-none"
        />
      ) : (
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <TopBar
        title="Editar perfil"
        showBack
        showActions={false}
        rightElement={
          <button onClick={handleSave} className="text-blue-500 font-semibold text-sm px-2">
            Guardar
          </button>
        }
      />
      <div className="pt-14">
        {/* Avatar */}
        <div className="flex flex-col items-center py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Avatar src={currentUser.avatar} alt={currentUser.username} size="xl" />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
              <Camera size={16} />
            </button>
          </div>
          <button className="mt-3 text-blue-500 font-semibold text-sm">
            Cambiar foto de perfil
          </button>
        </div>

        {/* Fields */}
        <Field
          label="Nombre"
          value={form.displayName}
          onChange={v => setForm(f => ({ ...f, displayName: v }))}
          placeholder="Tu nombre completo"
        />
        <Field
          label="Nombre de usuario"
          value={form.username}
          onChange={v => setForm(f => ({ ...f, username: v }))}
          placeholder="username"
        />
        <Field
          label="Biografía"
          value={form.bio}
          onChange={v => setForm(f => ({ ...f, bio: v }))}
          multiline
          placeholder="Escribe algo sobre ti..."
        />
        <Field
          label="Sitio web"
          value={form.website}
          onChange={v => setForm(f => ({ ...f, website: v }))}
          placeholder="https://tu-sitio.com"
        />

        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400">
            El nombre de usuario solo puede contener letras, números, guiones bajos y puntos.
          </p>
        </div>

        <div className="px-4 py-4">
          <button className="text-blue-500 font-medium text-sm">
            Cambiar contraseña
          </button>
        </div>
        <div className="px-4 py-2">
          <button className="text-red-500 font-medium text-sm">
            Desactivar cuenta temporalmente
          </button>
        </div>

        <div className="h-20" />
      </div>
    </div>
  );
}
