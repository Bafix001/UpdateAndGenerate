
FROM node:18

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers et installer les dépendances
COPY package.json package-lock.json ./
RUN npm install --production

# Copier le reste des fichiers
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Lancer le serveur
CMD ["node", "server.js"]
