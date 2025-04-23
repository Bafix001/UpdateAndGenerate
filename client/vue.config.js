module.exports = {
    // Configuration existante du proxy
    devServer: {
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: { '^/api': '' },
          secure: false
        }
      }
    },
  
    // Nouvelle configuration pour le titre
    chainWebpack: config => {
      config.plugin('html').tap(args => {
        args[0].title = "Update & Generate" // Titre par défaut
        return args
      })
    }
  }
  