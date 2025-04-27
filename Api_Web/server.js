const express = require('express');
const cors = require('cors');
const bonRoutes = require('./routes/bonRoutes');
const listeRoutes = require('./routes/listeRoutes');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuration CORS dynamique
const corsOrigins = process.env.CORS_ORIGINS.split(',');
app.use(cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));


// Middleware CSP
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self';" +
        " connect-src 'self' http://localhost:3000;" +
        " style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" +
        " font-src 'self' https://fonts.gstatic.com;" +
        " img-src 'self' data: blob: http://localhost:3000;"
    );
    next();
});

// Gestion des requêtes OPTIONS
app.options('*', cors());

// Middleware pour parser le JSON
app.use(express.json());

// Routes
app.use('/api', bonRoutes);
app.use('/api', listeRoutes);

// Dossier des uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dossier public
app.use(express.static('public'));

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});

