/**
 * 🤖 Serviço de Armazenamento Discord
 * 
 * Utiliza um bot Discord para armazenar imagens e arquivos
 * como alternativa econômica ao Firebase Storage
 */

// Configuração do Bot Discord
const DISCORD_CONFIG = {
  botToken: import.meta.env.VITE_DISCORD_BOT_TOKEN,
  serverId: '1423835753925836842',
  channels: {
    posts: '1423835753925836845',        // Canal para imagens de posts
    backups: '1423835753925836846',       // Canal para backups gerais
    profiles: '1423835753925836847'       // Canal para fotos de perfil
  }
};

/**
 * Upload de arquivo para Discord
 * @param {File} file - Arquivo a ser enviado
 * @param {string} channelType - Tipo de canal ('posts', 'backups', 'profiles')
 * @param {object} metadata - Metadados opcionais
 * @returns {Promise<{url: string, filename: string}>}
 */
export const uploadToDiscord = async (file, channelType = 'posts', metadata = {}) => {
  try {
    // Validar arquivo
    if (!file) {
      throw new Error('Nenhum arquivo fornecido');
    }

    // Validar tamanho (Discord: max 25MB para bots)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo: 25MB');
    }

    // Obter canal apropriado
    const channelId = DISCORD_CONFIG.channels[channelType] || DISCORD_CONFIG.channels.posts;

    // Preparar FormData
    const formData = new FormData();
    formData.append('file', file);

    // Criar mensagem com metadados
    const messageContent = {
      content: JSON.stringify({
        timestamp: new Date().toISOString(),
        originalName: file.name,
        size: file.size,
        type: file.type,
        ...metadata
      })
    };

    // Enviar arquivo para Discord
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_CONFIG.botToken}`
        },
        body: (() => {
          const fd = new FormData();
          fd.append('files[0]', file);
          fd.append('payload_json', JSON.stringify(messageContent));
          return fd;
        })()
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro Discord API:', errorData);
      throw new Error(`Erro ao enviar para Discord: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
    }

    const data = await response.json();

    // Extrair URL da imagem
    if (!data.attachments || data.attachments.length === 0) {
      throw new Error('Nenhum arquivo foi anexado na resposta do Discord');
    }

    const attachment = data.attachments[0];

    return {
      url: attachment.url,           // URL do CDN Discord
      proxyUrl: attachment.proxy_url, // URL alternativa
      filename: attachment.filename,
      size: attachment.size,
      messageId: data.id,             // ID da mensagem (para deletar depois)
      channelId: channelId
    };
  } catch (error) {
    console.error('Erro no uploadToDiscord:', error);
    throw error;
  }
};

/**
 * Deletar arquivo do Discord
 * @param {string} messageId - ID da mensagem contendo o arquivo
 * @param {string} channelId - ID do canal
 */
export const deleteFromDiscord = async (messageId, channelId) => {
  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bot ${DISCORD_CONFIG.botToken}`
        }
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Erro ao deletar do Discord: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erro ao deletar do Discord:', error);
    throw error;
  }
};

/**
 * Upload de múltiplos arquivos
 * @param {File[]} files - Array de arquivos
 * @param {string} channelType - Tipo de canal
 * @param {object} metadata - Metadados
 * @returns {Promise<Array>}
 */
export const uploadMultipleToDiscord = async (files, channelType = 'posts', metadata = {}) => {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await uploadToDiscord(file, channelType, metadata);
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({ 
        success: false, 
        filename: file.name, 
        error: error.message 
      });
    }
  }

  return results;
};

/**
 * Fazer backup de dados no Discord
 * @param {object} data - Dados a fazer backup
 * @param {string} backupName - Nome do backup
 */
export const backupToDiscord = async (data, backupName = 'backup') => {
  try {
    // Converter dados para JSON
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `${backupName}_${Date.now()}.json`, { type: 'application/json' });

    // Upload para canal de backups
    const result = await uploadToDiscord(file, 'backups', {
      backupName,
      timestamp: new Date().toISOString(),
      dataSize: jsonString.length
    });

    return result;
  } catch (error) {
    console.error('Erro ao fazer backup:', error);
    throw error;
  }
};

/**
 * Validar imagem antes do upload
 * @param {File} file - Arquivo a validar
 * @returns {Promise<boolean>}
 */
export const validateImage = async (file) => {
  // Validar tipo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de arquivo inválido. Use: JPG, PNG, GIF ou WebP');
  }

  // Validar tamanho
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (file.size > maxSize) {
    throw new Error('Imagem muito grande. Máximo: 25MB');
  }

  // Validar dimensões (opcional)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDimension = 8000;
      if (img.width > maxDimension || img.height > maxDimension) {
        reject(new Error(`Dimensões muito grandes. Máximo: ${maxDimension}x${maxDimension}px`));
      } else {
        resolve(true);
      }
    };
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Comprimir imagem antes do upload (opcional)
 * @param {File} file - Arquivo de imagem
 * @param {number} maxWidth - Largura máxima
 * @param {number} quality - Qualidade (0-1)
 * @returns {Promise<File>}
 */
export const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Redimensionar se necessário
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Erro ao comprimir imagem'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Criar canais no Discord (executar uma vez)
 * Nota: Isso requer permissões de administrador no servidor
 */
export const setupDiscordChannels = async () => {
  const channels = [
    { name: 'posts-images', topic: 'Imagens dos posts do feed social' },
    { name: 'backups', topic: 'Backups automáticos do sistema' },
    { name: 'profile-pictures', topic: 'Fotos de perfil dos usuários' }
  ];

  const results = [];

  for (const channel of channels) {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${DISCORD_CONFIG.serverId}/channels`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_CONFIG.botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: channel.name,
            type: 0, // Text channel
            topic: channel.topic
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        results.push({ success: true, name: channel.name, id: data.id });
        console.log(`✅ Canal criado: ${channel.name} (${data.id})`);
      } else {
        const error = await response.json();
        results.push({ success: false, name: channel.name, error });
        console.error(`❌ Erro ao criar canal ${channel.name}:`, error);
      }
    } catch (error) {
      results.push({ success: false, name: channel.name, error: error.message });
      console.error(`❌ Erro ao criar canal ${channel.name}:`, error);
    }
  }

  return results;
};

export default {
  uploadToDiscord,
  deleteFromDiscord,
  uploadMultipleToDiscord,
  backupToDiscord,
  validateImage,
  compressImage,
  setupDiscordChannels
};
