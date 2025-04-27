<template>
  <div class="upload-container">
    <input type="file" @change="handleFile" class="file-input" :key="fileKey" />
    <div class="button-group">
      <button @click="uploadFile('upload')" class="upload-button">📤 Bon d'Enlèvement</button>
      <button @click="uploadFile('uploadListe')" class="upload-button">📤 Liste des Éléments</button>
    </div>
    <p v-if="message" class="message">{{ message }}</p>
    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Traitement en cours...</p>
    </div>
    <div v-if="downloadLink" class="download-link">
      <a :href="downloadLink" target="_blank" download class="download-button" @click="resetForm">Télécharger le fichier PDF</a>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      file: null,
      message: "",
      downloadLink: "",
      fileKey: 0,
      isLoading: false,
      apiUrl: process.env.VUE_APP_API_URL || '/api', // Ajout de apiUrl
    };
  },
  methods: {
    handleFile(event) {
      this.message = "";
      this.downloadLink = "";
      this.file = event.target.files[0];
      const fileExtension = this.file.name.split('.').pop().toLowerCase();
      if (fileExtension !== 'csv') {
        this.message = "Seul les fichiers CSV sont acceptés.";
        this.file = null;
      }
    },
    async uploadFile(route) {
      if (!this.file) {
        this.message = "Sélectionne un fichier d'abord !";
        return;
      }
      this.isLoading = true;
      const formData = new FormData();
      formData.append("file", this.file);
      
      try {
        let apiRoute;
        if (route === 'upload') {
          apiRoute = 'upload';
        } else if (route === 'uploadListe') {
          apiRoute = 'uploadListe';
        } else {
          throw new Error("Route non valide");
        }

        const response = await axios.post(
          `${this.apiUrl}/${apiRoute}`, // Utilisation de apiUrl
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        this.message = response.data.message || 'Fichier traité avec succès !';
        if (response.data.fileUrl) {
          this.downloadLink = `${this.apiUrl}/${response.data.fileUrl.replace(/^\/+/, '')}`;
        }

        this.file = null;
        this.fileKey++;

      } catch (error) {
        console.error('Erreur lors de l\'appel API:', error);
        if (error.response && error.response.data) {
          this.message = error.response.data.message || "Erreur lors de l'upload";
        } else {
          this.message = "Erreur de connexion à l'API";
        }
      } finally {
        this.isLoading = false;
      }
    },
    resetForm() {
      this.file = null;
      this.message = "";
      this.downloadLink = "";
      this.fileKey++;
    },
  },
};
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.file-input {
  padding: 12px 16px;
  border: 2px dashed #666;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  cursor: pointer;
  color: #333;
  margin-bottom: 20px;
  transition: border-color 0.3s ease;
}

.file-input:focus {
  border-color: #007bff;
}

.button-group {
  display: flex;
  gap: 15px;
}

.upload-button {
  background: #007bff;
  border: none;
  padding: 12px 20px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 16px;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
}

.upload-button:hover {
  background: #0056b3;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.upload-button:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.4);
}

.message {
  margin-top: 10px;
  font-weight: bold;
  color: #e74c3c;
}

.download-link {
  margin-top: 20px;
}

.download-button {
  background: #28a745;
  padding: 12px 20px;
  border-radius: 30px;
  color: white;
  text-decoration: none;
  font-size: 16px;
  transition: 0.3s ease;
  display: inline-block;
}

.download-button:hover {
  background: #218838;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
