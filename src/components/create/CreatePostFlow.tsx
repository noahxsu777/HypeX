'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, MapPin, Film, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ImageUploader from '@/components/ui/ImageUploader';

type PostType = 'photo' | 'video' | 'reel';
type Step = 'type' | 'media' | 'caption';

export default function CreatePostFlow() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>('type');
  const [postType, setPostType] = useState<PostType>('photo');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMediaUpload = useCallback((url: string) => {
    setMediaUrls((prev) => [...prev, url]);
  }, []);

  const handleSubmit = async () => {
    if (mediaUrls.length === 0) return;
    setIsSubmitting(true);
    try {
      const endpoint = postType === 'reel' ? '/api/reels' : '/api/posts';
      const body =
        postType === 'reel'
          ? { video_url: mediaUrls[0], caption }
          : {
              media_urls: mediaUrls,
              caption,
              location,
              type: mediaUrls.length > 1 ? 'carousel' : 'photo',
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['feed'] });
        qc.invalidateQueries({ queryKey: ['reels'] });
        router.push('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const folder = postType === 'reel' ? 'reels' : 'posts';
  const accept =
    postType === 'photo'
      ? 'image/*'
      : postType === 'reel'
      ? 'video/*'
      : 'image/*,video/*';

  return (
    <div className="fixed inset-0 bg-white dark:bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        {step === 'type' ? (
          <button
            onClick={() => router.back()}
            className="text-gray-700 dark:text-gray-300"
          >
            <X size={24} />
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => (s === 'caption' ? 'media' : 'type'))}
            className="text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {step === 'type'
            ? 'Crear'
            : step === 'media'
            ? 'Seleccionar medios'
            : 'Nueva publicación'}
        </h2>
        {step === 'media' && mediaUrls.length > 0 ? (
          <button
            onClick={() => setStep('caption')}
            className="text-blue-500 font-semibold text-sm"
          >
            Siguiente
          </button>
        ) : step === 'caption' ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-blue-500 font-semibold text-sm disabled:opacity-50 flex items-center gap-1"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Compartir
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* Type selector */}
      {step === 'type' && (
        <div className="flex-1 flex flex-col justify-center px-6 gap-4">
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-2">
            ¿Qué quieres crear?
          </p>
          {[
            {
              type: 'photo' as PostType,
              icon: ImageIcon,
              label: 'Foto o carrusel',
              desc: 'Comparte imágenes con tu comunidad',
              color: 'from-blue-400 to-blue-600',
            },
            {
              type: 'video' as PostType,
              icon: Video,
              label: 'Video',
              desc: 'Comparte un video corto o largo',
              color: 'from-green-400 to-green-600',
            },
            {
              type: 'reel' as PostType,
              icon: Film,
              label: 'Reel',
              desc: 'Crea un video vertical en pantalla completa',
              color: 'from-purple-500 to-pink-500',
            },
          ].map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                setPostType(opt.type);
                setStep('media');
              }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.color} flex items-center justify-center flex-shrink-0`}
              >
                <opt.icon size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">{opt.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Media upload */}
      {step === 'media' && (
        <div className="flex-1 flex flex-col">
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-1 p-2">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative aspect-square">
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() =>
                      setMediaUrls((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-6">
            <ImageUploader
              onUpload={handleMediaUpload}
              accept={accept}
              folder={folder}
              multiple={postType !== 'reel'}
              className="w-full"
            >
              <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  {postType === 'photo' ? (
                    <ImageIcon size={32} className="text-gray-400" />
                  ) : (
                    <Film size={32} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {postType === 'reel' ? 'Selecciona un video' : 'Selecciona archivos'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {postType === 'photo'
                      ? 'JPG, PNG, WebP • Hasta 10 archivos'
                      : postType === 'reel'
                      ? 'MP4, MOV • Hasta 1GB'
                      : 'Imágenes y videos'}
                  </p>
                </div>
                <span className="px-5 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold">
                  Elegir de la galería
                </span>
              </div>
            </ImageUploader>
          </div>
        </div>
      )}

      {/* Caption step */}
      {step === 'caption' && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-start gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800">
            {mediaUrls[0] && (
              <img
                src={mediaUrls[0]}
                alt=""
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escribe un pie de foto..."
              rows={4}
              className="flex-1 text-sm text-gray-900 dark:text-white bg-transparent resize-none focus:outline-none"
              autoFocus
            />
          </div>

          <div className="text-right px-4 py-1">
            <span className="text-xs text-gray-400">{caption.length}/2200</span>
          </div>

          <div className="flex items-center gap-3 px-4 py-4 border-t border-gray-100 dark:border-gray-800">
            <MapPin size={20} className="text-gray-500 dark:text-gray-400" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ubicación..."
              className="flex-1 text-sm text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder-gray-400"
            />
          </div>

          {postType === 'photo' && mediaUrls.length > 1 && (
            <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/30 mx-4 rounded-xl mt-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {mediaUrls.length} fotos seleccionadas — se publicará como carrusel
              </p>
            </div>
          )}

          <div className="h-20" />
        </div>
      )}
    </div>
  );
}
