// scripts/backup.js
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function createBackup() {
  try {
    // Buscar todos os arquivos de dados
    const files = [
      'data/inventario.json',
      'data/emprestimos.json',
      'data/funcionarios.json',
      'data/ferramentas_danificadas.json',
      'data/ferramentas_perdidas.json'
    ];

    const backupData = {};
    
    for (const file of files) {
      const response = await octokit.repos.getContent({
        owner: 'changzaoo',
        repo: 'gardenalmoxarifado',
        path: file
      });
      
      backupData[file] = Buffer.from(response.data.content, 'base64').toString();
    }

    // Criar arquivo de backup
    const backupPath = `backup/auto-backups/backup-${Date.now()}.json`;
    const backupContent = {
      timestamp: new Date().toISOString(),
      data: backupData
    };

    await octokit.repos.createOrUpdateFileContents({
      owner: 'changzaoo',
      repo: 'gardenalmoxarifado',
      path: backupPath,
      message: `Backup automático ${new Date().toLocaleString()}`,
      content: Buffer.from(JSON.stringify(backupContent, null, 2)).toString('base64')
    });

    console.log('Backup criado com sucesso:', backupPath);
  } catch (error) {
    console.error('Erro ao criar backup:', error);
  }
}

// Executar backup diariamente
setInterval(createBackup, 24 * 60 * 60 * 1000);
createBackup(); // Executar imediatamente