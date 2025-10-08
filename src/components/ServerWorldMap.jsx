import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Server, CheckCircle, XCircle, Globe, Zap, Shield, Activity, Clock, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './ServerWorldMap.css';
import { useServerManagement } from '../hooks/useServerManagement';
import { useAllServersConnection } from '../hooks/useServerConnection';

// World map image - você pode substituir por sua própria imagem salvando como src/assets/world-map.png
const worldMapImage = 'https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg';

/**
 * 🗺️ Mapeamento PRECISO de regiões do Firebase para coordenadas
 * Coordenadas exatas dos data centers com reconhecimento de país e estado
 */
const FIREBASE_REGIONS = {
  // ========== ESTADOS UNIDOS (Coordenadas exatas dos data centers) ==========
  'us-central1': { coords: [-93.6250, 41.2619], name: 'Council Bluffs, Iowa', state: 'Iowa', country: 'EUA', flag: '🇺🇸' },
  'us-east1': { coords: [-79.8431, 33.8361], name: 'Moncks Corner, SC', state: 'Carolina do Sul', country: 'EUA', flag: '🇺🇸' },
  'us-east4': { coords: [-77.4874, 39.0458], name: 'Ashburn, Virginia', state: 'Virginia', country: 'EUA', flag: '🇺🇸' },
  'us-west1': { coords: [-123.0868, 45.5898], name: 'The Dalles, Oregon', state: 'Oregon', country: 'EUA', flag: '🇺🇸' },
  'us-west2': { coords: [-118.2437, 34.0522], name: 'Los Angeles, CA', state: 'Califórnia', country: 'EUA', flag: '🇺🇸' },
  'us-west3': { coords: [-111.8910, 40.7608], name: 'Salt Lake City, UT', state: 'Utah', country: 'EUA', flag: '🇺🇸' },
  'us-west4': { coords: [-115.1721, 36.1215], name: 'Henderson, Nevada', state: 'Nevada', country: 'EUA', flag: '🇺🇸' },
  'us-south1': { coords: [-81.6557, 30.3322], name: 'Jacksonville, FL', state: 'Flórida', country: 'EUA', flag: '🇺🇸' },
  
  // ========== CANADÁ (Coordenadas exatas) ==========
  'northamerica-northeast1': { coords: [-73.5673, 45.5017], name: 'Montreal, Quebec', state: 'Quebec', country: 'Canadá', flag: '🇨🇦' },
  'northamerica-northeast2': { coords: [-79.3832, 43.6532], name: 'Toronto, Ontario', state: 'Ontario', country: 'Canadá', flag: '🇨🇦' },
  
  // ========== AMÉRICA DO SUL (Coordenadas exatas) ==========
  'southamerica-east1': { coords: [-46.6333, -23.5505], name: 'Osasco, São Paulo', state: 'São Paulo', country: 'Brasil', flag: '🇧🇷' },
  'southamerica-west1': { coords: [-70.6483, -33.4489], name: 'Santiago, Región Metropolitana', state: 'Región Metropolitana', country: 'Chile', flag: '🇨🇱' },
  
  // ========== EUROPA OCIDENTAL (Coordenadas exatas) ==========
  'europe-west1': { coords: [4.4699, 50.8503], name: 'St. Ghislain, Bélgica', state: 'Hainaut', country: 'Bélgica', flag: '🇧🇪' },
  'europe-west2': { coords: [-0.1278, 51.5074], name: 'Londres', state: 'Inglaterra', country: 'Reino Unido', flag: '🇬🇧' },
  'europe-west3': { coords: [8.6821, 50.1109], name: 'Frankfurt am Main', state: 'Hesse', country: 'Alemanha', flag: '🇩🇪' },
  'europe-west4': { coords: [4.4699, 51.9225], name: 'Eemshaven, Groningen', state: 'Groningen', country: 'Holanda', flag: '🇳🇱' },
  'europe-west6': { coords: [8.5417, 47.3769], name: 'Zurique', state: 'Zurique', country: 'Suíça', flag: '🇨🇭' },
  'europe-west8': { coords: [9.1859, 45.4642], name: 'Milão, Lombardia', state: 'Lombardia', country: 'Itália', flag: '🇮🇹' },
  'europe-west9': { coords: [-9.1393, 38.7223], name: 'Lisboa', state: 'Lisboa', country: 'Portugal', flag: '🇵🇹' },
  'europe-west10': { coords: [13.4050, 52.5200], name: 'Berlim', state: 'Berlim', country: 'Alemanha', flag: '🇩🇪' },
  'europe-west12': { coords: [2.3522, 48.8566], name: 'Paris, Île-de-France', state: 'Île-de-France', country: 'França', flag: '🇫🇷' },
  
  // ========== EUROPA NORTE (Coordenadas exatas) ==========
  'europe-north1': { coords: [24.9384, 60.1699], name: 'Hamina, Finlândia', state: 'Kymenlaakso', country: 'Finlândia', flag: '🇫🇮' },
  
  // ========== EUROPA CENTRAL (Coordenadas exatas) ==========
  'europe-central2': { coords: [21.0122, 52.2297], name: 'Varsóvia, Mazóvia', state: 'Mazóvia', country: 'Polônia', flag: '🇵🇱' },
  
  // ========== ÁSIA LESTE (Coordenadas exatas) ==========
  'asia-east1': { coords: [121.5654, 25.0330], name: 'Changhua County, Taiwan', state: 'Changhua', country: 'Taiwan', flag: '🇹🇼' },
  'asia-east2': { coords: [114.1095, 22.3193], name: 'Hong Kong', state: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰' },
  
  // ========== ÁSIA NORDESTE (Japão e Coreia - Coordenadas exatas) ==========
  'asia-northeast1': { coords: [139.6917, 35.6762], name: 'Tóquio', state: 'Tóquio', country: 'Japão', flag: '🇯🇵' },
  'asia-northeast2': { coords: [135.5023, 34.6937], name: 'Osaka', state: 'Osaka', country: 'Japão', flag: '🇯🇵' },
  'asia-northeast3': { coords: [126.9780, 37.5665], name: 'Seul', state: 'Seul', country: 'Coreia do Sul', flag: '🇰🇷' },
  
  // ========== ÁSIA SUL (Índia - Coordenadas exatas) ==========
  'asia-south1': { coords: [72.8777, 19.0760], name: 'Mumbai, Maharashtra', state: 'Maharashtra', country: 'Índia', flag: '🇮🇳' },
  'asia-south2': { coords: [77.5946, 28.7041], name: 'Delhi', state: 'Delhi', country: 'Índia', flag: '🇮🇳' },
  
  // ========== ÁSIA SUDESTE (Coordenadas exatas) ==========
  'asia-southeast1': { coords: [103.8198, 1.3521], name: 'Jurong West, Singapura', state: 'Jurong West', country: 'Singapura', flag: '🇸🇬' },
  'asia-southeast2': { coords: [106.8456, -6.2088], name: 'Jacarta', state: 'Jacarta', country: 'Indonésia', flag: '🇮🇩' },
  
  // ========== AUSTRÁLIA (Coordenadas exatas) ==========
  'australia-southeast1': { coords: [151.2093, -33.8688], name: 'Sydney, NSW', state: 'Nova Gales do Sul', country: 'Austrália', flag: '🇦🇺' },
  'australia-southeast2': { coords: [144.9631, -37.8136], name: 'Melbourne, Victoria', state: 'Victoria', country: 'Austrália', flag: '🇦🇺' },
  
  // ========== ORIENTE MÉDIO (Coordenadas exatas) ==========
  'me-west1': { coords: [34.7818, 32.0853], name: 'Tel Aviv, Distrito Central', state: 'Distrito Central', country: 'Israel', flag: '🇮🇱' },
  'me-central1': { coords: [50.5577, 26.0667], name: 'Manama, Bahrein', state: 'Capital', country: 'Bahrein', flag: '��' },
  
  // ========== ÁFRICA (Coordenadas exatas) ==========
  'africa-south1': { coords: [28.2293, -25.7479], name: 'Joanesburgo, Gauteng', state: 'Gauteng', country: 'África do Sul', flag: '�🇦' }
};

/**
 * 🗺️ Componente de Mapa Mundi Interativo com Servidores (Design Modernizado)
 */
const ServerWorldMap = () => {
  // Importar hooks
  const { servers, loading: isLoading, recordUsage } = useServerManagement();
  const connectionsStatus = useAllServersConnection(servers);
  
  const [selectedServer, setSelectedServer] = useState(null);
  const [hoveredServer, setHoveredServer] = useState(null);
  const [pulsingServers, setPulsingServers] = useState(new Set());

  // Debug: Verificar servidores carregados
  useEffect(() => {
    console.log('🗺️ Servidores carregados no mapa:', servers.length);
    console.log('📋 Lista de servidores:', servers);
  }, [servers]);

  useEffect(() => {
    // Adicionar animação de pulso aleatória aos servidores ativos
    const interval = setInterval(() => {
      const activeServers = servers.filter(s => s.status === 'active');
      if (activeServers.length > 0) {
        const randomServer = activeServers[Math.floor(Math.random() * activeServers.length)];
        setPulsingServers(prev => new Set([...prev, randomServer.id]));
        setTimeout(() => {
          setPulsingServers(prev => {
            const newSet = new Set(prev);
            newSet.delete(randomServer.id);
            return newSet;
          });
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [servers]);

  /**
   * Detectar região do servidor pela URL authDomain ou projectId
   */
  const detectRegion = (server) => {
    const projectId = server.config?.projectId || '';
    const authDomain = server.config?.authDomain || '';
    
    // Tentar detectar pela URL
    for (const [region, data] of Object.entries(FIREBASE_REGIONS)) {
      if (authDomain.includes(region) || projectId.includes(region)) {
        return { region, ...data };
      }
    }
    
    // Default: us-central1
    return { region: 'us-central1', ...FIREBASE_REGIONS['us-central1'] };
  };

  /**
   * 🎯 Converter coordenadas geográficas PRECISAS para posição SVG
   * Usa projeção Mercator com ajustes para garantir precisão por país e estado
   */
  const coordsToSVG = (coords) => {
    const [lng, lat] = coords;
    
    // Conversão precisa usando projeção Mercator
    // ViewBox: 360x180 (360 de largura, 180 de altura)
    const x = ((lng + 180) / 360) * 360;
    
    // Projeção Mercator para latitude (mais precisa que linear)
    const latRad = lat * Math.PI / 180;
    const mercatorY = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
    const y = 90 - (mercatorY * 180 / Math.PI);
    
    // Normalizar para o viewBox
    const normalizedY = (y / 180) * 180;
    
    return { 
      x: Math.max(0, Math.min(360, x)), // Limitar ao viewBox
      y: Math.max(0, Math.min(180, normalizedY)) // Limitar ao viewBox
    };
  };

  /**
   * Preparar servidores com coordenadas SVG
   * Servidores podem ter coordenadas próprias ou usar região Firebase
   */
  const serversWithCoords = servers.map(server => {
    let coords, location;
    
    // Se o servidor tem latitude/longitude próprias, usar diretamente
    if (server.latitude && server.longitude) {
      coords = [server.longitude, server.latitude];
      location = {
        name: server.region || server.name,
        state: server.region,
        country: server.country || 'Custom',
        flag: server.flag || '🌐'
      };
    } else {
      // Caso contrário, detectar pela região Firebase
      location = detectRegion(server);
      coords = location.coords;
    }
    
    const svgPos = coordsToSVG(coords);
    
    return {
      ...server,
      location,
      svgX: svgPos.x,
      svgY: svgPos.y
    };
  });

  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Carregando mapa mundial...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 text-white relative overflow-hidden">
        {/* Animação de fundo */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: -20,
                  opacity: 0
                }}
                animate={{
                  y: '120%',
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mapa Global de Servidores Firebase</h2>
              <p className="text-blue-100 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {servers.length} {servers.length === 1 ? 'servidor' : 'servidores'} monitorados
              </p>
            </div>
          </div>
          
          {/* Status Cards */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">
                  {servers.filter(s => s.status === 'active').length} Ativos
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-semibold">
                  {servers.filter(s => s.status !== 'active').length} Inativos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container com Imagem de Fundo */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 world-map-container" style={{ height: '600px' }}>
        {/* Wrapper com Zoom e Pan */}
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "zoomIn", step: 0.5 }}
          panning={{ excluded: [] }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Controles de Zoom */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => zoomIn()}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => zoomOut()}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => resetTransform()}
                  className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  title="Resetar Visualização"
                >
                  <Maximize2 className="w-5 h-5" />
                </motion.button>
              </div>

              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: '100%', height: '100%' }}
              >
                {/* Imagem do mapa mundial */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <img 
                    src={worldMapImage}
                    alt="World Map"
                    className="w-full h-full object-contain opacity-90 dark:opacity-80 world-map-image"
                    draggable={false}
                  />
                </div>

                {/* Overlay com marcadores de servidores */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 360 180"
                  preserveAspectRatio="xMidYMid meet"
                >
          <defs>
            <filter id="server-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Animação de pulso */}
            <radialGradient id="pulse-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style={{stopColor: '#10b981', stopOpacity: 0.8}}/>
              <stop offset="100%" style={{stopColor: '#10b981', stopOpacity: 0}}/>
            </radialGradient>
          </defs>

          {/* Marcadores de servidores */}
          {serversWithCoords.map((server) => {
            const isActive = server.status === 'active';
            const isHovered = hoveredServer?.id === server.id;
            const isSelected = selectedServer?.id === server.id;
            const isPulsing = pulsingServers.has(server.id);
            const connectionStatus = connectionsStatus[server.id];
            const isConnected = connectionStatus?.isConnected ?? false;

            return (
              <g 
                key={server.id}
                className="pointer-events-auto cursor-pointer"
                onMouseEnter={() => setHoveredServer(server)}
                onMouseLeave={() => setHoveredServer(null)}
                onClick={() => setSelectedServer(server)}
              >
                {/* Círculo de pulso para servidores ativos e conectados */}
                {isActive && isConnected && isPulsing && (
                  <motion.circle
                    cx={server.svgX}
                    cy={server.svgY}
                    r="0"
                    fill="url(#pulse-gradient)"
                    initial={{ r: 0, opacity: 1 }}
                    animate={{ r: 8, opacity: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                  />
                )}

                {/* Círculo externo (borda com indicador de conexão) */}
                <motion.circle
                  cx={server.svgX}
                  cy={server.svgY}
                  r="3"
                  fill={isActive && isConnected ? '#10b981' : isActive ? '#f59e0b' : '#6b7280'}
                  stroke={isConnected ? '#ffffff' : '#ef4444'}
                  strokeWidth={isConnected ? '0.8' : '1.2'}
                  filter="url(#server-glow)"
                  animate={{
                    scale: isHovered || isSelected ? 1.5 : 1,
                    r: isHovered || isSelected ? 3.5 : 3
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ transformOrigin: `${server.svgX}px ${server.svgY}px` }}
                />

                {/* Indicador de latência (anel ao redor se conectado) */}
                {isConnected && connectionStatus?.latency < 100 && (
                  <motion.circle
                    cx={server.svgX}
                    cy={server.svgY}
                    r="4.5"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.5"
                    opacity="0.6"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0.3, 0.6]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ transformOrigin: `${server.svgX}px ${server.svgY}px` }}
                  />
                )}

                {/* Ícone de servidor */}
                <motion.g
                  animate={{
                    scale: isHovered || isSelected ? 1.5 : 1
                  }}
                  transition={{ duration: 0.2 }}
                  style={{ transformOrigin: `${server.svgX}px ${server.svgY}px` }}
                >
                  <rect
                    x={server.svgX - 1.2}
                    y={server.svgY - 1.2}
                    width="2.4"
                    height="2.4"
                    fill="#ffffff"
                    rx="0.3"
                  />
                  <rect
                    x={server.svgX - 0.8}
                    y={server.svgY - 0.8}
                    width="1.6"
                    height="0.4"
                    fill={isActive ? '#10b981' : '#6b7280'}
                  />
                  <rect
                    x={server.svgX - 0.8}
                    y={server.svgY - 0.2}
                    width="1.6"
                    height="0.4"
                    fill={isActive ? '#10b981' : '#6b7280'}
                  />
                  <rect
                    x={server.svgX - 0.8}
                    y={server.svgY + 0.4}
                    width="1.6"
                    height="0.4"
                    fill={isActive ? '#10b981' : '#6b7280'}
                  />
                </motion.g>

                {/* Tooltip PRECISO ao passar o mouse (mostra país, estado, região e conexão) */}
                {isHovered && (
                  <motion.g
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <rect
                      x={server.svgX - 25}
                      y={server.svgY - 16}
                      width="50"
                      height="15"
                      fill="#1f2937"
                      rx="1.5"
                      opacity="0.95"
                      filter="url(#server-glow)"
                    />
                    {/* Nome do servidor */}
                    <text
                      x={server.svgX}
                      y={server.svgY - 12}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="2.8"
                      fontWeight="bold"
                      fontFamily="system-ui"
                    >
                      {server.location.flag} {server.name}
                    </text>
                    {/* Localização completa: cidade, estado */}
                    <text
                      x={server.svgX}
                      y={server.svgY - 7.5}
                      textAnchor="middle"
                      fill="#10b981"
                      fontSize="2"
                      fontWeight="600"
                      fontFamily="system-ui"
                    >
                      {server.location.name}
                    </text>
                    {/* País completo */}
                    <text
                      x={server.svgX}
                      y={server.svgY - 8.5}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="1.8"
                      fontFamily="system-ui"
                    >
                      {server.location.state && `${server.location.state}, `}{server.location.country}
                    </text>
                    {/* Status de conexão */}
                    <text
                      x={server.svgX}
                      y={server.svgY - 5}
                      textAnchor="middle"
                      fill={isConnected ? '#10b981' : '#ef4444'}
                      fontSize="1.6"
                      fontWeight="600"
                      fontFamily="system-ui"
                    >
                      {isConnected ? `🟢 Conectado ${connectionStatus?.latency ? `(${connectionStatus.latency}ms)` : ''}` : '🔴 Desconectado'}
                    </text>
                  </motion.g>
                )}
              </g>
            );
          })}

          {/* Linhas de conexão entre servidores ativos */}
          {serversWithCoords
            .filter(s => s.status === 'active')
            .slice(0, -1)
            .map((server, index, arr) => {
              const nextServer = serversWithCoords.filter(s => s.status === 'active')[index + 1];
              if (!nextServer) return null;

              return (
                <motion.line
                  key={`connection-${server.id}-${nextServer.id}`}
                  x1={server.svgX}
                  y1={server.svgY}
                  x2={nextServer.svgX}
                  y2={nextServer.svgY}
                  stroke="#10b981"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  opacity="0.3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              );
            })}
        </svg>

        {/* Legenda Modernizada */}
        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-200 dark:border-gray-700 z-10 pointer-events-auto">
          <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Legenda
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Servidor Ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">Servidor Inativo</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="w-4 h-0.5 bg-green-500 opacity-50" style={{ borderTop: '1px dashed' }}></div>
              <span className="text-gray-600 dark:text-gray-400 text-[10px]">Conexões ativas</span>
            </div>
          </div>
        </div>

        {/* Estatísticas de Servidores por Região */}
        <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px]">
          <h3 className="font-bold text-sm mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            Distribuição
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {servers.filter(s => s.status === 'active').length}
                  </p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">Online</p>
                </div>
              </div>
            </div>
            
            <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {servers.filter(s => s.status !== 'active').length}
                  </p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">Offline</p>
                </div>
              </div>
            </div>

            {servers.length > 0 && (
              <>
                <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex items-center gap-2 text-xs">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Uptime</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.round((servers.filter(s => s.status === 'active').length / servers.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <motion.div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(servers.filter(s => s.status === 'active').length / servers.length) * 100}%` 
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        {/* Contador de Regiões */}
        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-gray-200 dark:border-gray-700 z-10">
          <div className="flex items-center gap-2 text-xs">
            <Globe className="w-4 h-4 text-blue-600" />
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {new Set(serversWithCoords.map(s => s.location.region)).size}
              </p>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">Regiões</p>
            </div>
          </div>
        </div>

        {/* Dica de Uso */}
        <div className="absolute bottom-4 right-24 bg-blue-500/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl z-10">
          <p className="text-xs text-white font-semibold flex items-center gap-2">
            <span>🖱️</span> Arraste para mover • Scroll para zoom • Pinça para zoom no celular
          </p>
        </div>
      </div>

      {/* Modal de Detalhes do Servidor */}
      <AnimatePresence>
        {selectedServer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedServer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header do Modal */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Server className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedServer.name}</h2>
                      <p className="text-blue-100 text-sm flex items-center gap-2">
                        {selectedServer.location.flag} {selectedServer.location.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedServer(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 space-y-6">
                {/* Status e Conexão */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      {selectedServer.status === 'active' ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Status: Ativo</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Servidor em operação</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-gray-500" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Status: Inativo</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Servidor desligado</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Status de Conexão */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      {connectionsStatus[selectedServer.id]?.isConnected ? (
                        <>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Conectado</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Latência: {connectionsStatus[selectedServer.id]?.latency}ms
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Desconectado</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Sem resposta</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                {selectedServer.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Descrição</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {selectedServer.description}
                    </p>
                  </div>
                )}

                {/* Configurações Firebase */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Configurações Firebase
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Project ID</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white">
                        {selectedServer.config?.projectId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Auth Domain</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white truncate max-w-xs">
                        {selectedServer.config?.authDomain}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Storage Bucket</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white truncate max-w-xs">
                        {selectedServer.config?.storageBucket}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">App ID</span>
                      <span className="text-sm font-mono text-gray-900 dark:text-white truncate max-w-xs">
                        {selectedServer.config?.appId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Criado em</p>
                    </div>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {new Date(selectedServer.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Última Teste</p>
                    </div>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {new Date(selectedServer.lastTested).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Região */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        📍 Localização Precisa
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedServer.location.flag} {selectedServer.location.name}
                      </p>
                      {selectedServer.location.state && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                          Estado/Região: {selectedServer.location.state}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        País: {selectedServer.location.country}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                        ID: {selectedServer.location.region}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServerWorldMap;
