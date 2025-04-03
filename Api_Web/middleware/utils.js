// utils.js
function cleanKeys(item) {
    const cleanedItem = {};
    for (const key in item) {
        if (item.hasOwnProperty(key)) {
            const cleanedKey = key.trim();  // Nettoyage de la clé (suppression des espaces)
            cleanedItem[cleanedKey] = item[key];
        }
    }
    return cleanedItem;
}

module.exports = { cleanKeys };
