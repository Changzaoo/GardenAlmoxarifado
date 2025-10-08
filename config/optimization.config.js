// Configuração de Otimização para Produção

module.exports = {
  optimization: {
    // Split chunks - separa bibliotecas grandes
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Bibliotecas React em bundle separado
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendor',
          priority: 40,
        },
        // Firebase em bundle separado
        firebase: {
          test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
          name: 'firebase-vendor',
          priority: 35,
        },
        // Framer Motion em bundle separado
        framerMotion: {
          test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
          name: 'framer-vendor',
          priority: 30,
        },
        // Lucide React (ícones) em bundle separado
        icons: {
          test: /[\\/]node_modules[\\/](lucide-react)[\\/]/,
          name: 'icons-vendor',
          priority: 25,
        },
        // Outras bibliotecas
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 20,
        },
        // Código comum da aplicação
        common: {
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        },
      },
      // Configurações de tamanho dos chunks
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      minSize: 20000,
      maxSize: 244000, // ~244KB
    },
    // Runtime chunk separado
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`,
    },
    // Minimização
    minimize: true,
    // Module IDs - hashed para cache
    moduleIds: 'deterministic',
    // Concatenação de módulos
    concatenateModules: true,
  },
  performance: {
    // Avisos de tamanho de bundle
    maxEntrypointSize: 512000, // 512KB
    maxAssetSize: 512000,
    hints: 'warning',
  },
};
