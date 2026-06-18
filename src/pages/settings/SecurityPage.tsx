import { useState } from 'react';
import { Shield, Smartphone, AlertTriangle, Trash2, ChevronRight, CheckCircle, Key } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import { useStore } from '../../store/useStore';
import { timeAgo } from '../../utils/helpers';

export default function SecurityPage() {
  const { settings, updateSettings } = useStore();
  const { security } = settings;
  const [show2FASetup, setShow2FASetup] = useState(false);

  const toggle2FA = () => {
    updateSettings({
      security: { ...security, twoFactorEnabled: !security.twoFactorEnabled },
    });
    if (!security.twoFactorEnabled) setShow2FASetup(true);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${value ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar title="Seguridad" showBack showActions={false} />
      <div className="pt-14 space-y-4 py-4">

        {/* 2FA */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Autenticación</p>
          </div>
          <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Autenticación en dos pasos
                  </p>
                  <Toggle value={security.twoFactorEnabled} onChange={toggle2FA} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Añade una capa extra de seguridad con un código de verificación al iniciar sesión.
                </p>
                {security.twoFactorEnabled && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle size={13} className="text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Activada</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-50 dark:border-gray-800">
            <AlertTriangle size={20} className="text-gray-500 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Alertas de inicio de sesión</p>
              <p className="text-xs text-gray-400">Recibe alertas sobre inicios de sesión no reconocidos</p>
            </div>
            <Toggle
              value={security.loginAlerts}
              onChange={() => updateSettings({ security: { ...security, loginAlerts: !security.loginAlerts } })}
            />
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-4">
            <Key size={20} className="text-gray-500 dark:text-gray-400" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Cambiar contraseña</p>
              <p className="text-xs text-gray-400">Última actualización hace 3 meses</p>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Active sessions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dispositivos activos</p>
          </div>
          {security.savedDevices.map((device, i) => (
            <div
              key={device.id}
              className={`flex items-center gap-3 px-4 py-4 ${i < security.savedDevices.length - 1 ? 'border-b border-gray-50 dark:border-gray-800' : ''}`}
            >
              <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone size={20} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{device.name}</p>
                  {device.isCurrent && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      Actual
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{device.location} · {timeAgo(device.lastSeen)}</p>
              </div>
              {!device.isCurrent && (
                <button className="text-red-500 text-xs font-medium">
                  Cerrar
                </button>
              )}
            </div>
          ))}
          <button className="w-full text-left px-4 py-3">
            <p className="text-sm text-blue-500 font-medium">Ver toda la actividad de inicio de sesión</p>
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl mx-3 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Zona de peligro</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-4">
            <Trash2 size={20} className="text-red-500" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-500">Eliminar cuenta</p>
              <p className="text-xs text-gray-400">Esta acción no se puede deshacer</p>
            </div>
          </button>
        </div>

        {/* 2FA setup modal */}
        {show2FASetup && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShow2FASetup(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center">
                  <Shield size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Autenticación en dos pasos</h3>
                  <p className="text-sm text-gray-500">Elige un método de verificación</p>
                </div>
              </div>
              {[
                { icon: '📱', title: 'Aplicación de autenticación', desc: 'Usa Google Authenticator o similar' },
                { icon: '💬', title: 'Mensaje de texto (SMS)', desc: 'Recibe un código por SMS' },
                { icon: '📧', title: 'Correo electrónico', desc: 'Recibe un código por email' },
              ].map(opt => (
                <button
                  key={opt.title}
                  onClick={() => setShow2FASetup(false)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 mb-2 text-left"
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{opt.title}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 ml-auto" />
                </button>
              ))}
              <button
                onClick={() => setShow2FASetup(false)}
                className="w-full py-3 text-gray-500 text-sm font-medium mt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="h-20" />
      </div>
    </div>
  );
}
