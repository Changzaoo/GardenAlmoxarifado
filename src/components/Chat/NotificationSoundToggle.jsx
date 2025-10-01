import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useMessageNotification } from '../../hooks/useMessageNotification';

export const NotificationSoundToggle = () => {
  const { soundEnabled, toggleSound } = useMessageNotification();

  return (
    <button
      onClick={toggleSound}
      className="p-2 rounded-full hover:bg-[#1f2937] transition-colors"
      title={soundEnabled ? 'Desativar som' : 'Ativar som'}
    >
      {soundEnabled ? (
        <Volume2 className="w-5 h-5 text-[#1d9bf0]" />
      ) : (
        <VolumeX className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );
};
