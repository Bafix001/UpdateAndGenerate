FROM node:18

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement les fichiers de dépendances d'abord
COPY package*.json ./

# Installer les dépendances en mode production
RUN npm ci --only=production

# Copier le reste des fichiers du projet
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Démarrer le serveur Node.js
CMD ["node", "server.js"]
