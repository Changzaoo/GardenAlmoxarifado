const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para gerar arquivo de versão durante o build
 * Atualiza automaticamente version.json com informações do build
 */

console.log('🔄 Gerando arquivo de versão...');

try {
  // Lê o package.json para pegar a versão
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Pega informações do Git se disponível
  let gitCommit = 'unknown';
  let gitBranch = 'unknown';
  
  try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.warn('⚠️  Git não disponível, usando valores padrão');
  }
  
  // Gera informações do build
  const buildDate = new Date().toISOString();
  const buildNumber = Date.now(); // Timestamp como build number único
  
  const versionInfo = {
    version: packageJson.version,
    buildDate: buildDate,
    buildNumber: buildNumber,
    buildId: `build-${buildNumber}`,
    gitCommit: gitCommit,
    gitBranch: gitBranch,
    environment: process.env.NODE_ENV || 'production',
    timestamp: Date.now()
  };
  
  // Caminho para salvar o arquivo
  const publicDir = path.join(__dirname, '..', 'public');
  const versionFilePath = path.join(publicDir, 'version.json');
  
  // Garante que o diretório existe
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Escreve o arquivo
  fs.writeFileSync(
    versionFilePath,
    JSON.stringify(versionInfo, null, 2),
    'utf8'
  );
  
  console.log('✅ Arquivo de versão gerado com sucesso!');
  console.log('📦 Versão:', versionInfo.version);
  console.log('🔢 Build:', versionInfo.buildNumber);
  console.log('📅 Data:', versionInfo.buildDate);
  console.log('🌿 Branch:', versionInfo.gitBranch);
  console.log('💾 Commit:', versionInfo.gitCommit);
  
} catch (error) {
  console.error('❌ Erro ao gerar arquivo de versão:', error);
  process.exit(1);
}
