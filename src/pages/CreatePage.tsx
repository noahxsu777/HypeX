import { useState } from 'react';
import { X, Image, Video, Film, ChevronDown, MapPin, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PostType = 'photo' | 'reel' | 'story';

export default function CreatePage() {
  const navigate = useNavigate();
  const [postType, setPostType] = useState<PostType>('photo');
  const [caption, setCaption] = useState('');
  const [step, setStep] = useState<'select' | 'edit' | 'share'>('select');

  const types = [
    { id: 'photo' as PostType, icon: Image, label: 'Publicación' },
    { id: 'reel' as PostType, icon: Film, label: 'Reel' },
    { id: 'story' as PostType, icon: Video, label: 'Historia' },
  ];

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 dark:text-gray-300 font-medium"
        >
          <X size={24} />
        </button>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Crear</h2>
        <button
          onClick={() => setStep('share')}
          className="text-blue-500 font-semibold text-sm"
        >
          Siguiente
        </button>
      </div>

      {/* Type selector */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {types.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setPostType(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              postType === id
                ? 'border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white'
                : 'text-gray-400'
            }`}
          >
            <Icon size={20} strokeWidth={postType === id ? 2 : 1.5} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Gallery area */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            {postType === 'photo' && <Image size={40} className="text-gray-400" />}
            {postType === 'reel' && <Film size={40} className="text-gray-400" />}
            {postType === 'story' && <Video size={40} className="text-gray-400" />}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {postType === 'photo' ? 'Selecciona una foto' : postType === 'reel' ? 'Selecciona un video' : 'Crea una historia'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Toca para elegir de tu galería
            </p>
          </div>
          <button className="px-6 py-2.5 bg-blue-500 text-white rounded-full text-sm font-semibold">
            Seleccionar de la galería
          </button>
        </div>
      </div>

      {/* Caption input (shown after image selection) */}
      {step === 'share' && (
        <div className="absolute inset-0 bg-white dark:bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <button onClick={() => setStep('edit')} className="text-gray-600 dark:text-gray-300">
              Atrás
            </button>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nueva publicación</h2>
            <button
              onClick={() => navigate('/')}
              className="text-blue-500 font-semibold text-sm"
            >
              Compartir
            </button>
          </div>

          <div className="flex items-start gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Escribe un pie de foto..."
              className="flex-1 text-sm text-gray-900 dark:text-white bg-transparent resize-none focus:outline-none min-h-[80px]"
              autoFocus
            />
          </div>

          <div className="space-y-0">
            {[
              { icon: Tag, label: 'Etiquetar personas' },
              { icon: MapPin, label: 'Añadir ubicación' },
              { icon: ChevronDown, label: 'Opciones avanzadas' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{label}</span>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
