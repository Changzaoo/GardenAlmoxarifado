// 📷 Página de Leitura de QR Code
// Escaneia QR Code e redireciona para criação/redefinição

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import QrScanner from 'react-qr-scanner';
import { Camera, CheckCircle, XCircle, Loader, AlertTriangle, Key } from 'lucide-react';
import { validarQRCode } from '../../services/qrCodeAuth';

const QRCodeScanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [escaneando, setEscaneando] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [validando, setValidando] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  
  // Verificar se já tem token na URL (QR Code lido fora do app)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const id = params.get('id');
    
    if (token && id) {
      validarEProcessarQRCode(token, id);
    }
  }, [location]);
  
  const validarEProcessarQRCode = async (token, id) => {
    setValidando(true);
    setErro('');
    setMensagem('');
    
    try {
      const resultado = await validarQRCode(token, id);
      
      if (!resultado.success) {
        setErro(resultado.error);
        setEscaneando(false);
        setValidando(false);
        return;
      }
      
      setQrCodeData(resultado.qrCode);
      setMensagem('QR Code válido! Redirecionando...');
      
      // Aguardar 1 segundo antes de redirecionar
      setTimeout(() => {
        if (resultado.qrCode.tipo === 'criacao_conta') {
          // Redirecionar para criação de conta com dados pré-preenchidos
          navigate('/criar-conta', {
            state: {
              qrToken: token,
              qrId: id,
              nivelUsuario: resultado.qrCode.nivelUsuario,
              empresaId: resultado.qrCode.empresaId,
              empresaNome: resultado.qrCode.empresaNome,
              setorId: resultado.qrCode.setorId,
              setorNome: resultado.qrCode.setorNome
            }
          });
        } else if (resultado.qrCode.tipo === 'redefinicao_senha') {
          // Redirecionar para redefinição de senha
          navigate('/redefinir-senha', {
            state: {
              qrToken: token,
              qrId: id,
              usuarioId: resultado.qrCode.usuarioId,
              usuarioEmail: resultado.qrCode.usuarioEmail,
              usuarioNome: resultado.qrCode.usuarioNome
            }
          });
        }
      }, 1500);
    } catch (error) {
      console.error('Erro ao validar QR Code:', error);
      setErro('Erro ao validar QR Code. Tente novamente.');
      setEscaneando(false);
    } finally {
      setValidando(false);
    }
  };
  
  const handleScan = (data) => {
    if (data && !validando) {
      try {
        // Extrair URL do QR Code
        const url = new URL(data.text || data);
        const params = new URLSearchParams(url.search);
        const token = params.get('token');
        const id = params.get('id');
        
        if (token && id) {
          setEscaneando(false);
          validarEProcessarQRCode(token, id);
        } else {
          setErro('QR Code inválido');
        }
      } catch (error) {
        console.error('Erro ao processar QR Code:', error);
        setErro('QR Code inválido');
      }
    }
  };
  
  const handleError = (error) => {
    console.error('Erro na câmera:', error);
    setErro('Erro ao acessar câmera. Verifique as permissões.');
  };
  
  const reiniciarEscaneamento = () => {
    setEscaneando(true);
    setErro('');
    setMensagem('');
    setQrCodeData(null);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Escanear QR Code</h1>
              <p className="text-blue-100 text-sm">
                Aponte a câmera para o QR Code
              </p>
            </div>
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Scanner ou Mensagem */}
          <div className="relative">
            {escaneando && !validando && (
              <div className="relative rounded-xl overflow-hidden bg-black">
                <QrScanner
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ width: '100%' }}
                  constraints={{
                    video: { facingMode: 'environment' }
                  }}
                />
                
                {/* Overlay de guia */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-white/50 rounded-2xl shadow-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-white font-semibold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                    Posicione o QR Code dentro da área
                  </p>
                </div>
              </div>
            )}
            
            {validando && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader className="w-16 h-16 text-blue-600 animate-spin" />
                <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
                  Validando QR Code...
                </p>
              </div>
            )}
            
            {mensagem && !validando && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-green-700 dark:text-green-400 font-bold text-xl text-center">
                  {mensagem}
                </p>
                {qrCodeData && (
                  <div className="text-center space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-2 justify-center">
                      <Key className="w-4 h-4" />
                      {qrCodeData.tipo === 'criacao_conta' ? 'Criação de Conta' : 'Redefinição de Senha'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
            
            {erro && !validando && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                  {erro.includes('expirado') || erro.includes('utilizado') ? (
                    <AlertTriangle className="w-16 h-16 text-red-600 dark:text-red-400" />
                  ) : (
                    <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <p className="text-red-700 dark:text-red-400 font-bold text-xl text-center">
                  {erro}
                </p>
                <button
                  onClick={reiniciarEscaneamento}
                  className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Tentar Novamente
                </button>
              </motion.div>
            )}
          </div>
          
          {/* Instruções */}
          {escaneando && !validando && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4">
              <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">📋 Instruções:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Aponte a câmera para o QR Code</li>
                <li>• Mantenha o dispositivo estável</li>
                <li>• Aguarde a leitura automática</li>
                <li>• Você será redirecionado automaticamente</li>
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default QRCodeScanner;
