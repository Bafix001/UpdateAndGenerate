<template>
  <div id="app">
    <!-- En-tête avec logo -->
    <header class="header">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
    </header>

    <!-- Contenu central avec le titre et le composant FileUploader -->
    <div class="container">
      <h2>📂 Upload de Fichiers</h2>
      <p>Chargez vos fichiers CSV pour générer des PDF facilement.</p>
      <FileUploader />
    </div>
  </div>
</template>

<script>
import FileUploader from "./components/FileUploader.vue"; // Import du composant FileUploader

export default {
  components: {
    FileUploader, // Enregistrement du composant FileUploader
  },
};
</script>

<style>
/* Style global de la page */
body {
  margin: 0;
  font-family: "Poppins", sans-serif;
  background: #e0e0e0; /* Fond légèrement gris clair pour réduire l'intensité du blanc */
  color: #333; /* Couleur sombre pour les textes */
  display: flex;
  justify-content: center; /* Centrer horizontalement */
  align-items: center; /* Centrer verticalement */
  height: 100vh; /* Prendre toute la hauteur de la fenêtre */
  min-height: 100%; /* Assurer que la page prend toute la hauteur même si le contenu est moins long */
}

/* En-tête avec logo */
.header {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%); /* Centrer horizontalement */
  margin-bottom: 30px;
}

.logo {
  height: 200px; /* Taille agrandie du logo */
  width: auto; /* Garder les proportions du logo */
}

/* Contenu principal au centre de la page */
.container {
  text-align: center;
  color: #333;
  padding: 40px;
  background: #f7f7f7; /* Fond plus doux que le blanc pur */
  border-radius: 8px; /* Coins arrondis */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Ombre discrète */
  width: 100%;
  max-width: 600px; /* Largeur maximale */
}

/* Titre principal */
h2 {
  font-size: 24px;
  margin-bottom: 15px;
  color: #333; /* Couleur sombre */
}

/* Description sous le titre */
p {
  font-size: 16px;
  margin-bottom: 30px;
  color: #666; /* Couleur plus claire pour le texte */
}
</style>
