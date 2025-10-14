import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, 
  GitCommit, 
  Calendar, 
  User, 
  MessageSquare,
  ExternalLink,
  Server,
  Cloud,
  Activity,
  Clock
} from 'lucide-react';

const DeployInfo = () => {
  const [deployInfo, setDeployInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarInfoDeploy();
  }, []);

  const carregarInfoDeploy = async () => {
    try {
      const response = await fetch('/version.json');
      const data = await response.json();
      setDeployInfo(data);
    } catch (error) {
      console.error('Erro ao carregar informações de deploy:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (isoString) => {
    if (!isoString || isoString === 'unknown') return 'Indisponível';
    try {
      const data = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(data);
    } catch {
      return 'Indisponível';
    }
  };

  const formatarDataCompleta = (isoString) => {
    if (!isoString || isoString === 'unknown') return 'Indisponível';
    try {
      const data = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'long'
      }).format(data);
    } catch {
      return 'Indisponível';
    }
  };

  const getGitHubRepoUrl = () => {
    if (!deployInfo?.git?.remoteUrl) return null;
    
    // Converter URL git para URL do GitHub
    const url = deployInfo.git.remoteUrl;
    if (url.includes('github.com')) {
      return url
        .replace('git@github.com:', 'https://github.com/')
        .replace('.git', '');
    }
    return null;
  };

  const getCommitUrl = () => {
    const repoUrl = getGitHubRepoUrl();
    if (!repoUrl || !deployInfo?.git?.commitFull) return null;
    return `${repoUrl}/commit/${deployInfo.git.commitFull}`;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!deployInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Informações de deploy não disponíveis
        </p>
      </div>
    );
  }

  const repoUrl = getGitHubRepoUrl();
  const commitUrl = getCommitUrl();
  const isVercelDeploy = deployInfo.vercel?.env !== null;

  return (
    <div className="space-y-4">
      {/* Card Principal - Versão e Build */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 rounded-xl flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Deploy Atual
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Versão {deployInfo.version}
              </p>
            </div>
          </div>
          {isVercelDeploy && (
            <div className="flex items-center gap-2 px-3 py-1 bg-black dark:bg-white rounded-lg">
              <Cloud className="w-4 h-4 text-white dark:text-black" />
              <span className="text-xs font-semibold text-white dark:text-black">
                VERCEL
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                BUILD
              </span>
            </div>
            <p className="text-sm font-mono text-gray-900 dark:text-white">
              {deployInfo.buildNumber}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatarData(deployInfo.buildDate)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                DEPLOY
              </span>
            </div>
            <p className="text-xs text-gray-900 dark:text-white">
              {formatarDataCompleta(deployInfo.buildDate)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card Git Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-md font-bold text-gray-900 dark:text-white">
            Informações do Git
          </h4>
        </div>

        <div className="space-y-3">
          {/* Commit */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <GitCommit className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  COMMIT
                </span>
                {commitUrl && (
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                {deployInfo.git.commit}
              </p>
              {deployInfo.git.message && deployInfo.git.message !== 'unknown' && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {deployInfo.git.message}
                </p>
              )}
            </div>
          </div>

          {/* Branch */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <GitBranch className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                BRANCH
              </span>
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {deployInfo.git.branch}
              </span>
            </div>
          </div>

          {/* Autor */}
          {deployInfo.git.author && deployInfo.git.author !== 'unknown' && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  AUTOR
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {deployInfo.git.author}
                </span>
              </div>
            </div>
          )}

          {/* Data do Commit */}
          {deployInfo.git.date && deployInfo.git.date !== 'unknown' && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                  DATA DO COMMIT
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatarData(deployInfo.git.date)}
                </span>
              </div>
            </div>
          )}

          {/* Link do Repositório */}
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">
                Ver Repositório no GitHub
              </span>
            </a>
          )}
        </div>
      </motion.div>

      {/* Card Vercel Info (se disponível) */}
      {isVercelDeploy && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white dark:text-black" />
            </div>
            <h4 className="text-md font-bold text-gray-900 dark:text-white">
              Vercel Deployment
            </h4>
          </div>

          <div className="space-y-3">
            {deployInfo.vercel.env && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  AMBIENTE
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  deployInfo.vercel.env === 'production' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {deployInfo.vercel.env.toUpperCase()}
                </span>
              </div>
            )}

            {deployInfo.vercel.url && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  URL
                </span>
                <a
                  href={`https://${deployInfo.vercel.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {deployInfo.vercel.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {deployInfo.vercel.repoOwner && deployInfo.vercel.repoSlug && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  REPOSITÓRIO
                </span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {deployInfo.vercel.repoOwner}/{deployInfo.vercel.repoSlug}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DeployInfo;
