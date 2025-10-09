// 📱 Componente de Display de QR Code
// Exibe QR Codes gerados com animações e informações

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle, Download, X, Clock, User, Building2, Briefcase, Key } from 'lucide-react';

const QRCodeDisplay = ({ qrCode, onClose, onRevoke }) => {
  const [copiado, setCopiado] = useState(false);
  
  if (!qrCode) return null;
  
  const copiarURL = () => {
    navigator.clipboard.writeText(qrCode.url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };
  
  const baixarQRCode = () => {
    const svg = document.getElementById('qrcode-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `qrcode-${qrCode.tipo}-${qrCode.token}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };
  
  const formatarData = (data) => {
    if (!data) return 'N/A';
    const d = typeof data === 'string' ? new Date(data) : data.toDate();
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const calcularTempoRestante = () => {
    const agora = new Date();
    const expira = new Date(qrCode.expiraEm);
    const diff = expira - agora;
    
    if (diff <= 0) return 'Expirado';
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-xl">
              <Key className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {qrCode.tipo === 'criacao_conta' ? '✨ QR Code de Criação de Conta' : '🔄 QR Code de Redefinição de Senha'}
              </h2>
              <p className="text-blue-100 text-sm">
                Código único e seguro
              </p>
            </div>
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <div className="p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg">
              <QRCodeSVG
                id="qrcode-svg"
                value={qrCode.url}
                size={256}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={copiarURL}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                {copiado ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copiar URL
                  </>
                )}
              </button>
              
              <button
                onClick={baixarQRCode}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
              >
                <Download className="w-5 h-5" />
                Baixar
              </button>
            </div>
          </div>
          
          {/* Informações */}
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-bold text-gray-700 dark:text-gray-200">Validade</span>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Expira em:</strong> {formatarData(qrCode.expiraEm)}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Tempo restante:</strong> <span className="text-green-600 dark:text-green-400 font-bold">{calcularTempoRestante()}</span>
                </p>
              </div>
            </div>
            
            {qrCode.tipo === 'criacao_conta' && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-gray-700 dark:text-gray-200">Dados da Conta</span>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Nível:</strong> {qrCode.nivelUsuario === '0' ? '🔐 Admin' : `Nível ${qrCode.nivelUsuario}`}
                  </p>
                  {qrCode.empresaNome && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Building2 className="w-4 h-4" />
                      <span><strong>Empresa:</strong> {qrCode.empresaNome}</span>
                    </div>
                  )}
                  {qrCode.setorNome && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Briefcase className="w-4 h-4" />
                      <span><strong>Setor:</strong> {qrCode.setorNome}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {qrCode.tipo === 'redefinicao_senha' && (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-bold text-gray-700 dark:text-gray-200">Usuário</span>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Nome:</strong> {qrCode.usuarioNome}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>Email:</strong> {qrCode.usuarioEmail}
                  </p>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
              <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
                <p><strong>Criado por:</strong> {qrCode.criadoPor}</p>
                <p><strong>Criado em:</strong> {formatarData(qrCode.criadoEm)}</p>
                <p className="text-xs mt-2 font-mono bg-gray-200 dark:bg-gray-700 p-2 rounded">
                  Token: {qrCode.token}
                </p>
              </div>
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja revogar este QR Code? Ele não poderá mais ser usado.')) {
                  onRevoke(qrCode.id);
                  onClose();
                }
              }}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Revogar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QRCodeDisplay;
