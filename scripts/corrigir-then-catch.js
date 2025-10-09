/**
 * Script para corrigir .then() e .catch() órfãos após remoção de console.logs
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'src');
let arquivosCorrigidos = 0;

function corrigirThenCatch(conteudo) {
  let conteudoNovo = conteudo;
  
  // Remove .then() vazios ou só com comentários
  conteudoNovo = conteudoNovo.replace(/\.then\(\(\)\s*=>\s*\{?\s*\}?\)/g, '');
  conteudoNovo = conteudoNovo.replace(/\.then\(\(\w+\)\s*=>\s*\{?\s*\}?\)/g, '');
  
  // Remove .catch() vazios
  conteudoNovo = conteudoNovo.replace(/\.catch\(\(\w*\)\s*=>\s*\{?\s*\}?\)/g, '.catch(() => {})');
  
  // Remove promises órfãs (});\n seguido de } catch sem try)
  conteudoNovo = conteudoNovo.replace(/\}\);\s*\n\s*\}\s*catch\s*\(/g, '});\n    } catch (');
  
  // Remove linhas com apenas })
  conteudoNovo = conteudoNovo.replace(/^\s*\}\);?\s*$/gm, '');
  
  // Remove try/catch órfãos
  conteudoNovo = conteudoNovo.replace(/\}\s*catch\s*\(\w+\)\s*\{[^}]*\}/g, '');
  
  return conteudoNovo;
}

function processarArquivo(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
    const conteudoNovo = corrigirThenCatch(conteudo);
    
    if (conteudo !== conteudoNovo) {
      fs.writeFileSync(caminhoArquivo, conteudoNovo, 'utf8');
      console.log(`✅ ${path.relative(srcPath, caminhoArquivo)}`);
      arquivosCorrigidos++;
    }
  } catch (error) {
    console.error(`❌ ${caminhoArquivo}:`, error.message);
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

console.log('🔧 Corrigindo .then() e .catch() órfãos...\n');
percorrerDiretorio(srcPath);
console.log(`\n✅ ${arquivosCorrigidos} arquivos corrigidos`);
