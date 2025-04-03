const express = require('express');
const multer = require('multer');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const axios = require('axios');
const sharp = require('sharp');
const stream = require('stream');
const upload = require('../middleware/uploadMiddleware');  // Middleware d'upload
const { cleanKeys } = require('../middleware/utils');

const router = express.Router();

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

// Endpoint pour uploader le fichier CSV, traiter le CSV et générer un PDF
router.post('/uploadListe', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucun fichier téléchargé');
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => {
            const cleanedData = {};
            Object.keys(data).forEach((key) => {
                cleanedData[key.trim()] = data[key]?.trim() || 'Non spécifié';
            });
            results.push(cleanedData);
        })
        .on('end', async () => {
            console.log('Données CSV nettoyées:', results);
            
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

            const outputPath = path.join(outputDir, `liste_${csvFileName}.pdf`);

            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            doc.pipe(fs.createWriteStream(outputPath));

            // === En-tête du PDF ===
            const logoPath = path.join(__dirname, '..', 'templates', 'logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 20, { width: 150, height: 75 });
            } else {
                doc.fontSize(14).text('LUMA ARLES', 50, 20);
            }

            const dateEdition = new Date().toLocaleDateString('fr-FR');
            doc.font('Helvetica-Bold').fontSize(10).text(`Date : ${dateEdition}`, 100, 90);

            let titleSpacing = 40; // Ajuste cette valeur pour descendre le texte plus bas
            let yPosition = 150;
            doc.font('Helvetica-Bold')
                .fontSize(14)
                .text(`Liste de ${csvFileName}`, { align: 'center' })
                .moveDown(0.2) 
                .text('Service de Production', { align: 'center' })
                .moveDown(2);

            doc.font('Helvetica').fontSize(12); // Réinitialisation de la police

            const footerText = `FDD LUMA/ARLES
                SIEGE SOCIAL : 7-9-11 RUE DE LA REPUBLIQUE, 13200 ARLES - SIRET 800185977 00025
                ADRESSE POSTALE : PARC DES ATELIERS, CS 50007, 13633 ARLES CEDEX`;
            const footerHeight = 50; // Ajuste selon la hauteur réelle du pied de page
            const pageHeight = doc.page.height;
            const marginBottom = 50;  

            let initialSpacing = 50; // Ajuste selon le besoin
            yPosition += initialSpacing;

            for (const item of results) {
                const spaceNeededForItem = 120 + footerHeight + marginBottom; // Espace nécessaire pour l'item + pied de page
                if (yPosition + spaceNeededForItem > pageHeight) {
                    doc.addPage();
                    yPosition = 50;
                }
                const x = 50;

                await processImage(item, x, yPosition, doc); // Gestion des images

                doc.fontSize(8).text(`SKU: ${item['SKU'] || 'Non spécifié'}`, x + 100, yPosition);
                doc.fontSize(8).text(`Dénomination: ${item['Dénomination'] || 'Non spécifié'}`, x + 100, yPosition + 15);
                doc.fontSize(8).text(`Couleur: ${item['Couleur'] || 'Non spécifié'}, Matière: ${item['Matière'] || 'Non spécifié'}`, x + 100, yPosition + 30);
                doc.fontSize(8).text(`Dimension: ${item['Dimension'] || 'Non spécifié'}, Poids: ${item['Poids'] || 'Non spécifié'}`, x + 100, yPosition + 50);
                doc.fontSize(8).text(`Stockage: ${item['Stockage'] || 'Non spécifié'}, Emplacement: ${item['Emplacement'] || 'Non spécifié'}`, x + 100, yPosition + 70);

                yPosition += 120; // Espacement entre les éléments
            }

            // === Pied de page ===
            const footerYPosition = pageHeight - marginBottom - footerHeight;
            doc.fontSize(8).text(footerText, 50, footerYPosition, {
                width: doc.page.width - 100,  // Largeur du texte
                align: 'left',  // Alignement à gauche
                lineBreak: true  // Permet des retours à la ligne automatiques
            });

            doc.end(); // Terminer le document PDF

            // Une fois le PDF généré, renvoyer l'URL pour le télécharger
            res.status(200).json({
                message: 'PDF généré avec succès',
                fileUrl: `/uploads/liste_${csvFileName}.pdf`
            });

            // Supprimer le fichier PDF après un délai (par exemple, 10 secondes)
            setTimeout(() => {
                fs.unlink(outputPath, (err) => {
                    if (err) {
                        console.error('Erreur lors de la suppression du fichier PDF:', err);
                    } else {
                        console.log('Fichier PDF supprimé avec succès');
                    }
                });
            }, 10000); // 10 secondes
        })
        .on('error', (error) => {
            console.error('Erreur lors de l\'analyse du CSV:', error);
            res.status(500).send('Erreur lors du traitement du fichier CSV');
        });
});

module.exports = router;
