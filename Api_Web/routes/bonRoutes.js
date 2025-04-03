const express = require('express');
const multer = require('multer');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const sharp = require('sharp');
const stream = require('stream');
const upload = require('../middleware/uploadMiddleware');  // Le middleware d'upload
const { cleanKeys } = require('../middleware/utils');

const router = express.Router();

// Limite la taille des fichiers à 5 Mo (par exemple)
const MAX_FILE_SIZE = 5 * 1024 * 1024;  // 5MB

// Fonction asynchrone pour télécharger et traiter les images
async function processImage(item, x, yPosition, doc) {
    const imagePath = item['Photo']?.trim(); // Suppression des espaces inutiles

    if (imagePath) {
        try {
            let imageUrl = imagePath.match(/\((https?.+?)\)/)?.[1] || imagePath;

            if (!imageUrl) throw new Error('URL de l\'image non valide ou manquante');

            const response = await axios({ url: imageUrl, responseType: 'arraybuffer' });
            const contentType = response.headers['content-type'];

            if (contentType && (contentType.startsWith('image/jpeg') || contentType.startsWith('image/png') || contentType.startsWith('image/webp'))) {
                let buffer = Buffer.from(response.data);

                if (contentType.startsWith('image/webp')) {
                    buffer = await sharp(buffer).png().toBuffer(); // Conversion WebP vers PNG
                }

                // Insérer l'image dans le PDF
                doc.image(buffer, x, yPosition, { width: 70, height: 70 });
            } else {
                throw new Error(`Type d'image non supporté : ${contentType}`);
            }
        } catch (error) {
            console.error('Erreur lors du traitement de l\'image:', error);
            // Ajouter une image de secours
            const backupImagePath = path.join(__dirname, '..', 'templates', 'no-image.png');
            if (fs.existsSync(backupImagePath)) {
                doc.image(backupImagePath, x, yPosition, { width: 70, height: 70 });
            } else {
                doc.rect(x, yPosition, 70, 70).stroke();
                doc.fontSize(8).text('Erreur Image', x, yPosition + 30, { width: 70, align: 'center' });
            }
        }
    } else {
        doc.rect(x, yPosition, 70, 70).stroke();
        doc.fontSize(8).text('Pas d\'image', x, yPosition + 30, { width: 70, align: 'center' });
    }
}

// Middleware de vérification de fichier pour limiter la taille et le type
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (file.mimetype !== 'text/csv' || fileExtension !== '.csv') {
        return cb(new Error('Seul les fichiers CSV sont autorisés.'));
    }
    if (file.size > MAX_FILE_SIZE) {
        return cb(new Error('Le fichier dépasse la taille maximale autorisée (5 Mo).'));
    }
    cb(null, true);
};

// Endpoint pour uploader le fichier CSV, traiter le CSV et générer un PDF
router.post('/upload', upload.single('file', { fileFilter }), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucun fichier téléchargé');
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => {
            // Nettoyage automatique des clés et des valeurs
            const cleanedData = {};
            Object.keys(data).forEach((key) => {
                cleanedData[key.trim()] = data[key]?.trim() || 'Non spécifié';
            });
            results.push(cleanedData);
        })
        .on('end', async () => {
            console.log('Données CSV nettoyées:', results);

            // Définir le chemin d'enregistrement du PDF dans le dossier 'uploads'
            const outputDir = path.join(__dirname, '..', 'uploads');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);  // Créer le dossier s'il n'existe pas
            }

            // Extraire le nom du fichier CSV, nettoyage et formatage
            const csvFileName = path
                .parse(req.file.originalname)
                .name
                .toLowerCase()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_]/g, '')
                .split('_')[0];

            const outputPath = path.join(outputDir, `bon_d'enlevement_${csvFileName}.pdf`);

            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Enregistrer le PDF dans le dossier 'uploads'
            doc.pipe(fs.createWriteStream(outputPath));

            // === En-tête du PDF ===
            const logoPath = path.join(__dirname, '..', 'templates', 'logo.png');
            if (fs.existsSync(logoPath)) {
                // Augmenter la taille du logo tout en gardant une position verticale raisonnable
                doc.image(logoPath, 50, 20, { width: 150, height: 75 });
            } else {
                doc.fontSize(14).text('LUMA ARLES', 50, 20);
            }

            const dateEdition = new Date().toLocaleDateString('fr-FR');

            // Mettre la date en gras
            doc.font('Helvetica-Bold').fontSize(10).text(`Date : ${dateEdition}`, 100, 90);

            // Mettre "Bon d'enlèvement/livraison" en gras
            const bonYPosition = 120; // Position ajustée pour ne pas descendre trop
            doc.font('Helvetica-Bold').fontSize(14).text("Bon d'enlèvement/livraison", 50, bonYPosition, { align: 'center' }).moveDown();

            // N'oubliez pas de réinitialiser la police par défaut si nécessaire
            doc.font('Helvetica').fontSize(12); // Exemple de réinitialisation

            // === Tableau de base ===
            const tableX = 50;
            const tableY = 140;
            const cellWidth = 250;
            const cellHeight = 20;
            const largeCellHeight = cellHeight * 3;

            function drawTableCell(x, y, width, height, text) {
                doc.rect(x, y, width, height).stroke();
                doc.fontSize(10).text(text, x + 5, y + 5);
            }

            // Tableau avec les cases spécifiques
            drawTableCell(tableX, tableY, cellWidth, cellHeight, "Origine");
            drawTableCell(tableX + cellWidth, tableY, cellWidth, cellHeight, "Destination");
            drawTableCell(tableX, tableY + cellHeight, cellWidth, largeCellHeight, ""); // Case vide
            drawTableCell(tableX + cellWidth, tableY + cellHeight, cellWidth, largeCellHeight, ""); // Case vide
            drawTableCell(tableX, tableY + cellHeight + largeCellHeight, cellWidth, cellHeight, "Nom, date et signature");
            drawTableCell(tableX + cellWidth, tableY + cellHeight + largeCellHeight, cellWidth, cellHeight, "Nom, date et signature");
            drawTableCell(tableX, tableY + cellHeight * 2 + largeCellHeight, cellWidth, largeCellHeight, ""); // Case vide
            drawTableCell(tableX + cellWidth, tableY + cellHeight * 2 + largeCellHeight, cellWidth, largeCellHeight, ""); // Case vide

            let yPosition = tableY + 7 * cellHeight + largeCellHeight + 30;
            let itemsOnPage = 0;

            const footerText = `FDD LUMA/ARLES
                SIEGE SOCIAL : 7-9-11 RUE DE LA REPUBLIQUE, 13200 ARLES - SIRET 800185977 00025
                ADRESSE POSTALE : PARC DES ATELIERS, CS 50007, 13633 ARLES CEDEX`;
            const footerHeight = 50; // Ajuste selon la hauteur réelle de ton pied de page
            const pageHeight = doc.page.height;  // Hauteur de la page
            const marginBottom = 50;  // Marge du bas

            // === Remplissage du PDF ===
            for (const item of results) {
                // Calcule l'espace restant sur la page
                const spaceNeededForItem = 120 + footerHeight + marginBottom; // Espace nécessaire pour l'item + pied de page
                if (yPosition + spaceNeededForItem > pageHeight) {
                    doc.addPage();
                    yPosition = 50;
                    itemsOnPage = 0;
                }
                const x = 50;

                await processImage(item, x, yPosition, doc); // Gestion des images

                doc.fontSize(8).text(`SKU: ${item['SKU'] || 'Non spécifié'}`, x + 100, yPosition);
                doc.fontSize(8).text(`Dénomination: ${item['Dénomination'] || 'Non spécifié'}`, x + 100, yPosition + 15);
                doc.fontSize(8).text(`Couleur: ${item['Couleur'] || 'Non spécifié'}, Matière: ${item['Matière'] || 'Non spécifié'}`, x + 100, yPosition + 30);
                doc.fontSize(8).text(`Dimension: ${item['Dimension'] || 'Non spécifié'}, Poids: ${item['Poids'] || 'Non spécifié'}`, x + 100, yPosition + 50);
                doc.fontSize(8).text(`Stockage: ${item['Stockage'] || 'Non spécifié'}, Emplacement: ${item['Emplacement'] || 'Non spécifié'}`, x + 100, yPosition + 70);

                yPosition += 120; // Espacement entre les éléments
                itemsOnPage++;
            }

            // === Pied de page ===
            const footerYPosition = pageHeight - marginBottom - footerHeight;  // Position Y pour le pied de page

            // Ajouter le pied de page à la dernière position possible, directement sur la première page
            doc.fontSize(8).text(footerText, 50, footerYPosition, {
                width: doc.page.width - 100,  // Largeur du texte
                align: 'left',  // Alignement à gauche
                lineBreak: true  // Permet des retours à la ligne automatiques
            });

            doc.end(); // Terminer le document PDF

            // Une fois le PDF généré, renvoyer l'URL pour le télécharger
            res.status(200).json({
                message: 'PDF généré avec succès',
                fileUrl: `/uploads/bon_d'enlevement_${csvFileName}.pdf`
            });

            // Supprimer le fichier CSV après génération du PDF
            const csvFilePath = path.join(outputDir, req.file.originalname);
            fs.unlink(csvFilePath, (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression du fichier CSV:', err);
                } else {
                    console.log('Fichier CSV supprimé avec succès');
                }
            });

            // Supprimer le fichier PDF après un délai
            setTimeout(() => {
                fs.unlink(outputPath, (err) => {
                    if (err) {
                        console.error('Erreur lors de la suppression du fichier PDF:', err);
                    } else {
                        console.log('Fichier PDF supprimé avec succès');
                    }
                });
            }, 10000);  // 10 secondes de délai pour donner le temps au client de télécharger
        })
        .on('error', (error) => {
            console.error('Erreur lors de l\'analyse du CSV:', error);
            res.status(500).send('Erreur lors du traitement du fichier CSV');
        });
});

module.exports = router;
