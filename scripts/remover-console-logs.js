/**
 * Script para remover TODOS os console.log, console.warn, console.info, console.debug
 * Mantém APENAS console.error para debugging crítico
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');
let totalArquivosProcessados = 0;
let totalLogsRemovidos = 0;

function removerConsoleLogs(conteudo) {
  let logsRemovidos = 0;
  
  // Remove console.log, console.warn, console.info, console.debug
  // Mas MANTÉM console.error
  const padroes = [
    // console.log simples
    /^\s*console\.log\([^)]*\);?\s*$/gm,
    
    // console.log com múltiplas linhas
    /^\s*console\.log\(\s*[\s\S]*?\);?\s*$/gm,
    
    // console.warn
    /^\s*console\.warn\([^)]*\);?\s*$/gm,
    
    // console.info
    /^\s*console\.info\([^)]*\);?\s*$/gm,
    
    // console.debug
    /^\s*console\.debug\([^)]*\);?\s*$/gm,
    
    // Console logs inline em callbacks (ex: .then(() => console.log(...)))
    /\.then\(\(\)\s*=>\s*console\.(log|warn|info|debug)\([^)]*\)\)/g,
    /\.catch\(\(?\w*\)?\s*=>\s*console\.(log|warn|info|debug)\([^)]*\)\)/g,
  ];
  
  let conteudoNovo = conteudo;
  
  padroes.forEach(padrao => {
    const matches = conteudoNovo.match(padrao);
    if (matches) {
      logsRemovidos += matches.length;
      conteudoNovo = conteudoNovo.replace(padrao, '');
    }
  });
  
  // Remove linhas vazias duplicadas
  conteudoNovo = conteudoNovo.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { conteudoNovo, logsRemovidos };
}

function processarArquivo(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    const { conteudoNovo, logsRemovidos } = removerConsoleLogs(conteudo);
    
    if (logsRemovidos > 0) {
      fs.writeFileSync(caminhoArquivo, conteudoNovo, 'utf8');
      console.log(`✅ ${path.relative(srcPath, caminhoArquivo)}: ${logsRemovidos} logs removidos`);
      totalLogsRemovidos += logsRemovidos;
    }
    
    totalArquivosProcessados++;
  } catch (error) {
    console.error(`❌ Erro ao processar ${caminhoArquivo}:`, error.message);
  }
}

function percorrerDiretorio(dir) {
  const arquivos = fs.readdirSync(dir);
  
  arquivos.forEach(arquivo => {
    const caminhoCompleto = path.join(dir, arquivo);
    const stats = fs.statSync(caminhoCompleto);
    
    if (stats.isDirectory()) {
      percorrerDiretorio(caminhoCompleto);
    } else if (arquivo.endsWith('.js') || arquivo.endsWith('.jsx')) {
      processarArquivo(caminhoCompleto);
    }
  });
}

console.log('🚀 Iniciando remoção de console.logs...');
console.log('📁 Diretório:', srcPath);
console.log('⚠️  Mantendo apenas console.error');
console.log('');

percorrerDiretorio(srcPath);

console.log('');
console.log('='.repeat(60));
console.log('📊 RESUMO DA LIMPEZA');
console.log('='.repeat(60));
console.log(`✅ Arquivos processados: ${totalArquivosProcessados}`);
console.log(`🗑️  Logs removidos: ${totalLogsRemovidos}`);
console.log('✅ Mantidos: console.error (para debugging crítico)');
console.log('='.repeat(60));
console.log('');
console.log('🎉 Limpeza concluída! Sistema agora está muito mais leve.');
