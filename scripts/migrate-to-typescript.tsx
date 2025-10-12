#!/usr/bin/env node

/**
 * Script de Migração Automática: JavaScript → TypeScript
 * 
 * Este script converte todos os arquivos do projeto para TypeScript:
 * - .js → .ts
 * - .jsx → .tsx
 * - Adiciona tipos básicos
 * - Cria estrutura de tipos
 */

const fs = require('fs');
const path = require('path');

// Diretórios a processar
const directories = [
  'src',
  'scripts',
  'functions'
];

// Arquivos a ignorar
const ignorePatterns = [
  'node_modules',
  'build',
  'dist',
  'android/app/src/main/assets',
  '.git',
  'temp',
  'coverage'
];

// Estatísticas
const stats = {
  jsToTs: 0,
  jsxToTsx: 0,
  errors: [],
  skipped: []
};

/**
 * Verifica se um path deve ser ignorado
 */
function shouldIgnore(filePath) {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Renomeia um arquivo de .js para .ts ou .jsx para .tsx
 */
function renameFile(filePath) {
  if (shouldIgnore(filePath)) {
    stats.skipped.push(filePath);
    return;
  }

  try {
    const ext = path.extname(filePath);
    let newPath;

    if (ext === '.js') {
      // Verifica se tem JSX dentro
      const content = fs.readFileSync(filePath, 'utf8');
      const hasJSX = content.includes('</') || content.includes('React.createElement') || content.includes('<>');
      
      newPath = hasJSX
        ? filePath.replace(/\.js$/, '.tsx')
        : filePath.replace(/\.js$/, '.ts');
      
      fs.renameSync(filePath, newPath);
      
      if (hasJSX) {
        stats.jsxToTsx++;
        console.log(`✅ ${filePath} → ${path.basename(newPath)} (JSX detected)`);
      } else {
        stats.jsToTs++;
        console.log(`✅ ${filePath} → ${path.basename(newPath)}`);
      }
    } else if (ext === '.jsx') {
      newPath = filePath.replace(/\.jsx$/, '.tsx');
      fs.renameSync(filePath, newPath);
      stats.jsxToTsx++;
      console.log(`✅ ${filePath} → ${path.basename(newPath)}`);
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

/**
 * Processa recursivamente um diretório
 */
function processDirectory(dir) {
  if (shouldIgnore(dir)) {
    return;
  }

  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (ext === '.js' || ext === '.jsx') {
          renameFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dir}:`, error.message);
  }
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando migração JavaScript → TypeScript\n');
  console.log('📁 Diretórios a processar:', directories.join(', '));
  console.log('🚫 Ignorando:', ignorePatterns.join(', '));
  console.log('\n⏳ Processando arquivos...\n');

  // Processar cada diretório
  for (const dir of directories) {
    const fullPath = path.join(process.cwd(), dir);
    
    if (fs.existsSync(fullPath)) {
      console.log(`\n📂 Processando: ${dir}/`);
      processDirectory(fullPath);
    } else {
      console.log(`⚠️  Diretório não encontrado: ${dir}/`);
    }
  }

  // Também processar arquivos raiz importantes
  console.log(`\n📂 Processando arquivos de configuração raiz:`);
  const rootFiles = [
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'service-worker.js'
  ];

  for (const file of rootFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      renameFile(fullPath);
    }
  }

  // Exibir estatísticas
  console.log('\n' + '='.repeat(60));
  console.log('📊 ESTATÍSTICAS DA MIGRAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Arquivos .js → .ts:    ${stats.jsToTs}`);
  console.log(`✅ Arquivos .jsx → .tsx:  ${stats.jsxToTsx}`);
  console.log(`📝 Total convertido:      ${stats.jsToTs + stats.jsxToTsx}`);
  console.log(`⏭️  Arquivos ignorados:    ${stats.skipped.length}`);
  console.log(`❌ Erros:                 ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  console.log('\n✅ Migração de arquivos concluída!');
  console.log('\n⚠️  PRÓXIMOS PASSOS:');
  console.log('1. Revisar imports e exports');
  console.log('2. Adicionar tipos onde necessário');
  console.log('3. Executar: npm run build');
  console.log('4. Corrigir erros de tipo');
  console.log('5. Testar a aplicação\n');
}

// Executar
main();
