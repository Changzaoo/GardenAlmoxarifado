/**
 * 🚀 Script de Build com Versionamento Automático
 * 
 * Este script:
 * 1. Incrementa a versão automaticamente
 * 2. Atualiza version.json
 * 3. Gera timestamp de build
 * 4. Limpa cache antigo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

const log = (msg, color = 'reset') => {
  console.log(`${colors[color]}${msg}${colors.reset}`);
};

// Caminhos
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const versionJsonPath = path.join(__dirname, '..', 'public', 'version.json');
const analyticsPath = path.join(__dirname, '..', 'src', 'utils', 'analytics.ts');

// Ler package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Incrementar versão patch
const versionParts = packageJson.version.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1;
const newVersion = versionParts.join('.');

log('\n' + '='.repeat(60), 'bright');
log('🚀 BUILD COM VERSIONAMENTO AUTOMÁTICO', 'bright');
log('='.repeat(60), 'bright');

log(`\n📦 Versão Atual: ${packageJson.version}`, 'yellow');
log(`📦 Nova Versão: ${newVersion}`, 'green');

// Atualizar package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
log('✅ package.json atualizado', 'green');

// Criar version.json
const buildDate = new Date().toISOString();
const versionData = {
  version: newVersion,
  buildDate: buildDate,
  buildNumber: parseInt(versionParts[2]),
  environment: process.env.NODE_ENV || 'production'
};

fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf8');
log('✅ version.json criado', 'green');

// Atualizar analytics.ts
let analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
analyticsContent = analyticsContent.replace(
  /export const APP_VERSION = '[^']+';/,
  `export const APP_VERSION = '${newVersion}';`
);
analyticsContent = analyticsContent.replace(
  /export const BUILD_DATE = new Date\(\).toISOString\(\);/,
  `export const BUILD_DATE = '${buildDate}';`
);
fs.writeFileSync(analyticsPath, analyticsContent, 'utf8');
log('✅ analytics.ts atualizado', 'green');

// Atualizar Service Worker
const swPath = path.join(__dirname, '..', 'service-worker-updated.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  swContent = swContent.replace(
    /const CACHE_VERSION = '[^']+';/,
    `const CACHE_VERSION = '${newVersion}';`
  );
  fs.writeFileSync(swPath, swContent, 'utf8');
  log('✅ service-worker-updated.js atualizado', 'green');
}

log('\n' + '='.repeat(60), 'bright');
log('📊 INFORMAÇÕES DO BUILD', 'bright');
log('='.repeat(60), 'bright');
log(`\nVersão: ${newVersion}`, 'blue');
log(`Build Date: ${buildDate}`, 'blue');
log(`Build Number: ${versionData.buildNumber}`, 'blue');
log(`Environment: ${versionData.environment}`, 'blue');

// Executar build
log('\n' + '='.repeat(60), 'bright');
log('🔨 INICIANDO BUILD DO REACT', 'bright');
log('='.repeat(60), 'bright');

try {
  execSync('npm run build', { stdio: 'inherit' });
  
  log('\n' + '='.repeat(60), 'bright');
  log('✅ BUILD CONCLUÍDO COM SUCESSO!', 'green');
  log('='.repeat(60), 'bright');
  log(`\n📦 Versão ${newVersion} está pronta para deploy!`, 'green');
  log('\n💡 Para fazer deploy no Vercel:', 'yellow');
  log('   vercel --prod', 'bright');
  log('\n📝 Não esqueça de fazer commit:', 'yellow');
  log(`   git add .`, 'bright');
  log(`   git commit -m "build: versão ${newVersion}"`, 'bright');
  log(`   git push`, 'bright');
  log('\n');
  
} catch (error) {
  log('\n' + '='.repeat(60), 'red');
  log('❌ ERRO NO BUILD', 'red');
  log('='.repeat(60), 'red');
  console.error(error);
  process.exit(1);
}
