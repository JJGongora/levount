import fs from "fs";
import path from "path";

const utilities = {

    saveJsonResponse: async (data, filename) => {
        try {
            const filePath = path.join(__dirname, '..', filename);
            const dataString = JSON.stringify(data, null, 2);
            await fs.writeFile(filePath, dataString);
            console.log('¡Archivo guardado y sobrescrito con éxito!');
        } catch (error) {
            console.error('Error al guardar el archivo:', error);
        }
    },

    generatePaginationArray: (currentPage, totalPages) => {
        const delta = 1; // Número de botones junto al central.
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    }

};

export default utilities;