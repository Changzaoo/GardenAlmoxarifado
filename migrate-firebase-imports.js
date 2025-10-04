/**
 * 🔄 Script de Migração - Atualizar Imports do Firebase
 * 
 * Este script automaticamente:
 * 1. Encontra todos os arquivos que importam firebaseConfig
 * 2. Atualiza para importar de firebaseDual
 * 3. Gera relatório das mudanças
 */

const fs = require('fs');
const path = require('path');

// Configurações
const ROOT_DIR = path.join(__dirname, 'src');
const BACKUP_DIR = path.join(__dirname, '.migration-backup');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Estatísticas
let stats = {
  filesScanned: 0,
  filesUpdated: 0,
  importsUpdated: 0,
  errors: []
};

/**
 * 📁 Buscar arquivos recursivamente
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules e outros
      if (!file.startsWith('.') && file !== 'node_modules') {
        findFiles(filePath, fileList);
      }
    } else {
      // Verificar extensão
      const ext = path.extname(file);
      if (EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * 🔍 Verificar se arquivo tem imports do firebaseConfig
 */
function hasFirebaseImport(content) {
  return content.includes('firebaseConfig') && !content.includes('firebaseDual');
}

/**
 * 🔄 Atualizar imports no conteúdo
 */
function updateImports(content, filePath) {
  let updated = false;
  let count = 0;

  // Calcular caminho relativo para firebaseDual
  const fileDir = path.dirname(filePath);
  const configPath = path.join(ROOT_DIR, 'config', 'firebaseDual.js');
  let relativePath = path.relative(fileDir, configPath);

  // Normalizar path para usar / no import
  relativePath = relativePath.replace(/\\/g, '/');

  // Remover extensão .js
  relativePath = relativePath.replace(/\.js$/, '');

  // Adicionar ./ se não começar com ../
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  // Padrões de import para substituir
  const patterns = [
    // import ... from './firebaseConfig'
    /from\s+['"](.*)firebaseConfig['"]/g,
    // import('./firebaseConfig')
    /import\s*\(\s*['"](.*)firebaseConfig['"]\s*\)/g,
    // require('./firebaseConfig')
    /require\s*\(\s*['"](.*)firebaseConfig['"]\s*\)/g
  ];

  let newContent = content;

  patterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern)];
    
    matches.forEach(match => {
      const oldImport = match[0];
      const newImport = oldImport.replace(/firebaseConfig/g, relativePath);
      
      if (oldImport !== newImport) {
        newContent = newContent.replace(oldImport, newImport);
        updated = true;
        count++;
      }
    });
  });

  return { updated, content: newContent, count };
}

/**
 * 💾 Criar backup do arquivo
 */
function createBackup(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  const backupPath = path.join(BACKUP_DIR, relativePath);
  const backupDir = path.dirname(backupPath);

  // Criar diretório de backup se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Copiar arquivo
  fs.copyFileSync(filePath, backupPath);
}

/**
 * 📝 Processar arquivo
 */
function processFile(filePath) {
  try {
    stats.filesScanned++;

    const content = fs.readFileSync(filePath, 'utf-8');

    // Verificar se tem imports do firebaseConfig
    if (!hasFirebaseImport(content)) {
      return;
    }

    console.log(`\n📄 Processando: ${path.relative(ROOT_DIR, filePath)}`);

    // Criar backup
    createBackup(filePath);
    console.log('  💾 Backup criado');

    // Atualizar imports
    const { updated, content: newContent, count } = updateImports(content, filePath);

    if (updated) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      stats.filesUpdated++;
      stats.importsUpdated += count;
      console.log(`  ✅ Atualizado (${count} imports)`);
    } else {
      console.log('  ℹ️ Nenhuma alteração necessária');
    }

  } catch (error) {
    stats.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`  ❌ Erro: ${error.message}`);
  }
}

/**
 * 📊 Gerar relatório
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DE MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`\n📁 Arquivos escaneados: ${stats.filesScanned}`);
  console.log(`✅ Arquivos atualizados: ${stats.filesUpdated}`);
  console.log(`🔄 Imports atualizados: ${stats.importsUpdated}`);
  console.log(`❌ Erros: ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ Erros encontrados:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${path.relative(ROOT_DIR, file)}: ${error}`);
    });
  }

  console.log(`\n💾 Backups salvos em: ${BACKUP_DIR}`);
  console.log('\n' + '='.repeat(60));

  // Salvar relatório em arquivo
  const reportPath = path.join(__dirname, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
  console.log(`📄 Relatório salvo em: ${reportPath}\n`);
}

/**
 * 🚀 Executar migração
 */
function migrate() {
  console.log('🔄 Iniciando migração dos imports do Firebase...\n');

  // Criar diretório de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Buscar todos os arquivos
  console.log(`📁 Buscando arquivos em: ${ROOT_DIR}`);
  const files = findFiles(ROOT_DIR);
  console.log(`📄 ${files.length} arquivos encontrados\n`);

  // Processar cada arquivo
  files.forEach(processFile);

  // Gerar relatório
  generateReport();

  // Verificar se houve erros
  if (stats.errors.length > 0) {
    console.log('⚠️ Migração concluída com erros. Verifique o relatório acima.');
    process.exit(1);
  } else {
    console.log('✅ Migração concluída com sucesso!');
    console.log('\n🎯 Próximos passos:');
    console.log('1. Revisar as mudanças');
    console.log('2. Testar o aplicativo');
    console.log('3. Se houver problemas, restaurar de .migration-backup');
    process.exit(0);
  }
}

/**
 * 🔙 Restaurar backup
 */
function restore() {
  console.log('🔙 Restaurando arquivos do backup...\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    console.error('❌ Nenhum backup encontrado!');
    process.exit(1);
  }

  const backupFiles = findFiles(BACKUP_DIR);
  let restored = 0;

  backupFiles.forEach(backupPath => {
    const relativePath = path.relative(BACKUP_DIR, backupPath);
    const originalPath = path.join(ROOT_DIR, relativePath);

    try {
      fs.copyFileSync(backupPath, originalPath);
      console.log(`✅ Restaurado: ${relativePath}`);
      restored++;
    } catch (error) {
      console.error(`❌ Erro ao restaurar ${relativePath}: ${error.message}`);
    }
  });

  console.log(`\n✅ ${restored} arquivos restaurados!`);
  process.exit(0);
}

// Verificar argumentos
const args = process.argv.slice(2);

if (args.includes('--restore')) {
  restore();
} else if (args.includes('--help')) {
  console.log(`
🔄 Script de Migração - Firebase Imports

Uso:
  node migrate-firebase-imports.js          Executar migração
  node migrate-firebase-imports.js --restore Restaurar backup
  node migrate-firebase-imports.js --help    Mostrar ajuda

Descrição:
  Este script atualiza automaticamente todos os imports de 
  './firebaseConfig' para './config/firebaseDual' em todo o projeto.

  Um backup completo é criado em .migration-backup antes de qualquer alteração.
  `);
  process.exit(0);
} else {
  migrate();
}
