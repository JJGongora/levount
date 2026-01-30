import fs from "fs";
import path from "path";

const utilities = {

    saveJsonResponse: async(data, filename) => {
        try {
            const filePath = path.join(__dirname, '..', filename);
            const dataString = JSON.stringify(data, null, 2);
            await fs.writeFile(filePath, dataString);
            console.log('¡Archivo guardado y sobrescrito con éxito!');
        } catch (error) {
            console.error('Error al guardar el archivo:', error);
        }
    },

};

export default utilities;