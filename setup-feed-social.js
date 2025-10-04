/**
 * 🛠️ Script de Configuração Inicial do Feed Social
 * 
 * Execute este script no console do navegador (F12) após fazer login
 * Ele irá criar os canais necessários no Discord e exibir os IDs
 */

(async function setupFeedSocial() {
  console.log('🚀 Iniciando configuração do Feed Social...\n');

  const DISCORD_CONFIG = {
    botToken: 'SEU_BOT_TOKEN_AQUI', // Substitua pelo seu token
    serverId: '1423835753925836842'
  };

  const channels = [
    { 
      name: 'posts-images', 
      topic: '📸 Imagens dos posts do feed social',
      description: 'Canal automático para armazenamento de imagens de publicações'
    },
    { 
      name: 'backups', 
      topic: '💾 Backups automáticos do sistema',
      description: 'Canal para backups periódicos dos dados'
    },
    { 
      name: 'profile-pictures', 
      topic: '👤 Fotos de perfil dos usuários',
      description: 'Canal para armazenamento de avatares'
    }
  ];

  const results = [];

  console.log('📡 Criando canais no Discord...\n');

  for (const channel of channels) {
    try {
      console.log(`⏳ Criando canal: #${channel.name}...`);
      
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
        results.push({
          success: true,
          name: channel.name,
          id: data.id,
          description: channel.description
        });
        console.log(`✅ Canal #${channel.name} criado com sucesso!`);
        console.log(`   ID: ${data.id}\n`);
      } else {
        const error = await response.json();
        
        // Se canal já existe, tentar buscar ID
        if (error.code === 50035 || error.message?.includes('already exists')) {
          console.log(`⚠️  Canal #${channel.name} já existe. Buscando ID...`);
          
          // Buscar canais existentes
          const channelsResponse = await fetch(
            `https://discord.com/api/v10/guilds/${DISCORD_CONFIG.serverId}/channels`,
            {
              headers: {
                'Authorization': `Bot ${DISCORD_CONFIG.botToken}`
              }
            }
          );
          
          if (channelsResponse.ok) {
            const existingChannels = await channelsResponse.json();
            const existingChannel = existingChannels.find(c => c.name === channel.name);
            
            if (existingChannel) {
              results.push({
                success: true,
                name: channel.name,
                id: existingChannel.id,
                description: channel.description,
                existing: true
              });
              console.log(`✅ Canal encontrado: #${channel.name}`);
              console.log(`   ID: ${existingChannel.id}\n`);
            } else {
              throw new Error('Canal não encontrado');
            }
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      results.push({
        success: false,
        name: channel.name,
        error: error.message || 'Erro desconhecido',
        description: channel.description
      });
      console.error(`❌ Erro ao criar canal #${channel.name}:`, error.message);
      console.log('');
    }
  }

  // Exibir resumo
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA CONFIGURAÇÃO');
  console.log('='.repeat(70) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Canais criados/encontrados: ${successful.length}`);
  console.log(`❌ Falhas: ${failed.length}\n`);

  if (successful.length > 0) {
    console.log('📝 COPIE ESTES IDs PARA O CÓDIGO:\n');
    console.log('Arquivo: src/services/discordStorage.js');
    console.log('Localização: DISCORD_CONFIG.channels\n');
    
    console.log('```javascript');
    console.log('channels: {');
    successful.forEach(channel => {
      const key = channel.name.replace(/-/g, '').replace('images', '').replace('pictures', 's');
      console.log(`  ${key}: '${channel.id}',  // ${channel.description}`);
    });
    console.log('}');
    console.log('```\n');

    // Gerar código completo
    console.log('OU SUBSTITUA O OBJETO COMPLETO:\n');
    console.log('```javascript');
    console.log('const DISCORD_CONFIG = {');
    console.log(`  botToken: '${DISCORD_CONFIG.botToken}',`);
    console.log(`  serverId: '${DISCORD_CONFIG.serverId}',`);
    console.log('  channels: {');
    
    const postsChannel = successful.find(c => c.name === 'posts-images');
    const backupsChannel = successful.find(c => c.name === 'backups');
    const profilesChannel = successful.find(c => c.name === 'profile-pictures');
    
    if (postsChannel) console.log(`    posts: '${postsChannel.id}',`);
    if (backupsChannel) console.log(`    backups: '${backupsChannel.id}',`);
    if (profilesChannel) console.log(`    profiles: '${profilesChannel.id}'`);
    
    console.log('  }');
    console.log('};');
    console.log('```\n');
  }

  if (failed.length > 0) {
    console.log('⚠️  PROBLEMAS ENCONTRADOS:\n');
    failed.forEach(channel => {
      console.log(`❌ #${channel.name}:`);
      console.log(`   Erro: ${channel.error}\n`);
    });
  }

  console.log('='.repeat(70));
  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('='.repeat(70) + '\n');

  console.log('1. Copie os IDs dos canais acima');
  console.log('2. Abra: src/services/discordStorage.js');
  console.log('3. Substitua os IDs no objeto DISCORD_CONFIG.channels');
  console.log('4. Salve o arquivo');
  console.log('5. Recarregue a página (F5)');
  console.log('6. Teste criando uma publicação no Feed\n');

  console.log('✅ Configuração concluída!\n');

  // Retornar objeto para uso programático
  return {
    success: successful.length === channels.length,
    channels: results,
    config: {
      posts: successful.find(c => c.name === 'posts-images')?.id,
      backups: successful.find(c => c.name === 'backups')?.id,
      profiles: successful.find(c => c.name === 'profile-pictures')?.id
    }
  };
})();
