import React, { memo } from 'react';
import { Clock, Calendar, Wifi, WifiOff, PlayCircle, CheckCircle, AlertTriangle, Camera, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WorkPontoHeader = memo(({ 
  currentTime, 
  isOnline, 
  statusDia, 
  pontoHoje,
  userPreference,
  hasReferencePhoto 
}) => {
  return (
    <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">WorkPonto</h2>
            <p className="text-white/80 text-sm">Sistema de Ponto Eletrônico</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-300" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-300" />
          )}
        </div>
      </div>

      {/* Data e Hora Atual */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium text-sm sm:text-base">
              {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">
            {format(currentTime, 'HH:mm:ss')}
          </div>
        </div>
      </div>

      {/* Status do Dia com Indicador de Preferência */}
      <div className={`bg-${statusDia.color}-500/20 border border-${statusDia.color}-400/30 rounded-xl p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {statusDia.status === 'working' && <PlayCircle className="w-6 h-6" />}
            {statusDia.status === 'completed' && <CheckCircle className="w-6 h-6" />}
            {statusDia.status === 'pending' && <AlertTriangle className="w-6 h-6" />}
            <div>
              <p className="font-semibold text-lg">{statusDia.text}</p>
              {pontoHoje?.timestamp && (
                <p className="text-sm text-white/80">
                  Último registro: {format(pontoHoje.timestamp.toDate(), 'HH:mm')}
                </p>
              )}
            </div>
          </div>
          
          {/* Indicador de Preferência */}
          {userPreference && hasReferencePhoto && (
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
              {userPreference === 'camera' ? (
                <Camera className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">
                {userPreference === 'camera' ? 'Câmera' : 'URL'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

WorkPontoHeader.displayName = 'WorkPontoHeader';

export default WorkPontoHeader;
