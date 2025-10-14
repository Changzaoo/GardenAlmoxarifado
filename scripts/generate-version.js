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
  let gitCommitFull = 'unknown';
  let gitBranch = 'unknown';
  let gitCommitMessage = 'unknown';
  let gitCommitAuthor = 'unknown';
  let gitCommitDate = 'unknown';
  let gitRemoteUrl = 'unknown';
  
  try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    gitCommitFull = execSync('git rev-parse HEAD').toString().trim();
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    gitCommitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    gitCommitAuthor = execSync('git log -1 --pretty=%an').toString().trim();
    gitCommitDate = execSync('git log -1 --pretty=%aI').toString().trim();
    gitRemoteUrl = execSync('git config --get remote.origin.url').toString().trim();
  } catch (error) {
    console.warn('⚠️  Git não disponível, usando valores padrão');
  }
  
  // Gera informações do build
  const buildDate = new Date().toISOString();
  const buildNumber = Date.now(); // Timestamp como build number único
  
  // Informações do Vercel (se disponível via env vars)
  const vercelEnv = process.env.VERCEL_ENV || null;
  const vercelUrl = process.env.VERCEL_URL || null;
  const vercelGitCommitSha = process.env.VERCEL_GIT_COMMIT_SHA || gitCommitFull;
  const vercelGitCommitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || gitCommitMessage;
  const vercelGitCommitAuthor = process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || gitCommitAuthor;
  const vercelGitCommitRef = process.env.VERCEL_GIT_COMMIT_REF || gitBranch;
  const vercelGitRepoOwner = process.env.VERCEL_GIT_REPO_OWNER || null;
  const vercelGitRepoSlug = process.env.VERCEL_GIT_REPO_SLUG || null;
  
  const versionInfo = {
    version: packageJson.version,
    buildDate: buildDate,
    buildNumber: buildNumber,
    buildId: `build-${buildNumber}`,
    environment: process.env.NODE_ENV || 'production',
    timestamp: Date.now(),
    git: {
      commit: gitCommit,
      commitFull: gitCommitFull,
      branch: gitBranch,
      message: gitCommitMessage,
      author: gitCommitAuthor,
      date: gitCommitDate,
      remoteUrl: gitRemoteUrl
    },
    vercel: {
      env: vercelEnv,
      url: vercelUrl,
      commitSha: vercelGitCommitSha,
      commitMessage: vercelGitCommitMessage,
      commitAuthor: vercelGitCommitAuthor,
      commitRef: vercelGitCommitRef,
      repoOwner: vercelGitRepoOwner,
      repoSlug: vercelGitRepoSlug
    }
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
  console.log('🌿 Branch:', versionInfo.git.branch);
  console.log('💾 Commit:', versionInfo.git.commit);
  console.log('👤 Autor:', versionInfo.git.author);
  console.log('💬 Mensagem:', versionInfo.git.message);
  if (vercelEnv) {
    console.log('🔷 Vercel Env:', vercelEnv);
    console.log('🌐 Vercel URL:', vercelUrl);
  }
  
} catch (error) {
  console.error('❌ Erro ao gerar arquivo de versão:', error);
  process.exit(1);
}
