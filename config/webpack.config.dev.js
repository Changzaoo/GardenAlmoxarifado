module.exports = {
  // Configuração do servidor de desenvolvimento
  devServer: {
    headers: {
      'Service-Worker-Allowed': '/',
      'Content-Type': 'application/javascript',
    },
  },
  
  // Ignorar avisos de source map de node_modules
  ignoreWarnings: [
    {
      module: /node_modules/,
      message: /Failed to parse source map/,
    },
  ],
  
  // Configuração do source-map-loader para ignorar node_modules
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules\/react-zoom-pan-pinch/,
        ],
      },
    ],
  },
};
