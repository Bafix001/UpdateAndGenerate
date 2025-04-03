const express = require('express');
const cors = require('cors');
const bonRoutes = require('./routes/bonRoutes');  // Importer les routes pour le bon d'enlèvement
const listeRoutes = require('./routes/listeRoutes');  // Importer les routes pour la liste des éléments
const path = require('path'); // Ajouter cette ligne


const app = express();
const port = 3000;

// Configuration CORS
app.use(cors());

// Utilisation des routes
app.use('/api', bonRoutes);   // Route pour les bons d'enlèvement
app.use('/api', listeRoutes); // Route pour la liste des éléments

// Serve static files (PDFs, images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Servir les fichiers statiques (comme le logo)
app.use(express.static('public'));

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
