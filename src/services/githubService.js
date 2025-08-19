// services/githubService.js
class GitHubService {
  constructor(config) {
    this.config = config;
    this.localStorageKey = 'github_fallback_data';
    this.offlineMode = false;
    this.pendingChanges = [];
  }

  // Verificar conectividade
  async checkConnectivity() {
    try {
      const response = await fetch('https://api.github.com', { 
        method: 'HEAD'
      });
      this.offlineMode = !response.ok;
      return !this.offlineMode;
    } catch (error) {
      this.offlineMode = true;
      return false;
    }
  }

  // Buscar arquivo com fallback
  async fetchFile(path) {
    const isOnline = await this.checkConnectivity();
    
    if (!isOnline) {
      const localData = localStorage.getItem(`${this.localStorageKey}_${path}`);
      if (localData) {
        return JSON.parse(localData);
      }
      throw new Error('Offline e nenhum dado local disponível');
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) throw new Error('Erro ao buscar arquivo');

      const file = await response.json();
      const content = atob(file.content);
      
      // Salvar localmente para fallback
      localStorage.setItem(`${this.localStorageKey}_${path}`, JSON.stringify({
        content: content,
        sha: file.sha,
        lastUpdated: new Date().toISOString()
      }));

      return file;
    } catch (error) {
      console.error('Erro GitHub, usando fallback local:', error);
      const localData = localStorage.getItem(`${this.localStorageKey}_${path}`);
      if (localData) {
        return JSON.parse(localData);
      }
      throw error;
    }
  }

  // Atualizar arquivo com fallback
  async updateFile(path, content, message) {
    const isOnline = await this.checkConnectivity();
    const currentFile = await this.fetchFile(path);
    
    if (!isOnline) {
      // Armazenar mudanças pendentes
      this.pendingChanges.push({
        path,
        content,
        message,
        sha: currentFile.sha,
        timestamp: new Date().toISOString()
      });
      
      // Salvar localmente
      localStorage.setItem(`${this.localStorageKey}_${path}`, JSON.stringify({
        content: content,
        sha: currentFile.sha,
        lastUpdated: new Date().toISOString(),
        pendingSync: true
      }));
      
      return { success: true, offline: true };
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha: currentFile.sha
          })
        }
      );

      if (!response.ok) throw new Error('Erro ao atualizar arquivo');

      // Remover do modo offline se existia
      localStorage.removeItem(`${this.localStorageKey}_${path}_pending`);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar, salvando localmente:', error);
      
      this.pendingChanges.push({
        path,
        content,
        message,
        sha: currentFile.sha,
        timestamp: new Date().toISOString()
      });

      localStorage.setItem(`${this.localStorageKey}_${path}`, JSON.stringify({
        content: content,
        sha: currentFile.sha,
        lastUpdated: new Date().toISOString(),
        pendingSync: true
      }));

      return { success: true, offline: true };
    }
  }

  // Sincronizar mudanças pendentes
  async syncPendingChanges() {
    const isOnline = await this.checkConnectivity();
    if (!isOnline) return false;

    const success = [];
    const errors = [];

    for (const change of this.pendingChanges) {
      try {
        const result = await this.updateFile(
          change.path,
          change.content,
          `Sync: ${change.message}`
        );
        
        if (result.success) {
          success.push(change.path);
        }
      } catch (error) {
        errors.push({ path: change.path, error });
      }
    }

    // Remover sucessos da lista pendente
    this.pendingChanges = this.pendingChanges.filter(
      change => !success.includes(change.path)
    );

    return { success, errors };
  }

  // Verificar se há mudanças pendentes
  hasPendingChanges() {
    return this.pendingChanges.length > 0;
  }
}

// Exportar funções individuais para compatibilidade com código existente
export const fetchGithubFile = async (config) => {
  const service = new GitHubService(config);
  return service.fetchFile(config.path);
};

export const updateGithubFile = async (config) => {
  const service = new GitHubService(config);
  return service.updateFile(config.path, config.content, config.message);
};

// Exportar a classe também
export default GitHubService;