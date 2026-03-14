import QueryString from "qs";

const filterHelper = {

    processFilters: (rawArray) => {
        const uniqueSet = new Set();

        rawArray.forEach(item => {
            if (!item) return;
            const parts = item.split(','); // Solo comas

            parts.forEach(part => {
                let text = part.trim();
                if (!text) return;

                text = text.toLowerCase().split(' ')
                        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
                        .join(' ');

                uniqueSet.add(text);
            });
        });
        
        return Array.from(uniqueSet).sort();

    },

    cleanEmptyFields: function(data) {
        if (typeof data !== 'object' || data === null) return data;

        Object.keys(data).forEach(key => {
            let value = data[key]; //console.log(value);
            if (typeof value === 'object' && value !== null) {
                this.cleanEmptyFields(value);
            } else {
                if (value === 'true' || value === 'on' || value == 1) {
                    data[key] = true;
                }
                else if (value === 'false' || value === 'off') {
                    data[key] = false;
                }
                else if (typeof value === 'string' && value.trim() === '') {
                    data[key] = null;
                }
                else if ((value === 0 && typeof value !== 'boolean') || value === 'null') {
                    data[key] = null;
                }
            }
        });
        const cleanData = QueryString.parse(data);
        return cleanData;
    },

    dbResultStatus: (result, entityName) => {

        if (!result || result.affectedRows === 0) {
            return { 
                step: entityName, 
                status: "failed", 
                message: `No se ha insertado ${entityName}, ya existía o no hubo cambios.` 
            };
        }
        
        const action = result.affectedRows === 1 ? "registrado" : "actualizado";
        return { 
            step: entityName, 
            status: "success", 
            message: `Se ha ${action} ${entityName} correctamente.` 
        };
    },

    inputDateToEnglish: (stringDate) => {
        if (!stringDate) return null;
        const date = new Date(stringDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',  
            day: 'numeric',
            timeZone: 'UTC'
        });
    },

    getUrlParams: (url) => {
        const searchParams = new URLSearchParams(url.search);
        const params = {};
    },

    shapeToCategory: {
        english: (shape) => {
            switch(shape) {
                case "A": return "rings"; break;
                case "B": return "earrings"; break;
                case "C": return "pendants"; break;
                case "D": return "necklaces"; break;
                case "E": return "necklaces"; break;
                case "F": return "bracelets"; break;
                case "G": return "bracelets"; break;
                case "H": return "accesories"; break;
                case "N": return "earrings"; break;
                case "Q": return "necklaces"; break;
                case "R": return "necklaces"; break;
                case "V": return "accesories"; break;
                default: return null; break;
            }
        },
        spanish: (shape) => {
            switch(shape) {
                case "A": return "anillos"; break;
                case "B": return "aretes"; break;
                case "C": return "dijes"; break;
                case "D": return "collares"; break;
                case "E": return "collares"; break;
                case "F": return "brazaletes"; break;
                case "G": return "brazaletes"; break;
                case "H": return "accesorios"; break;
                case "N": return "aretes"; break;
                case "Q": return "collares"; break;
                case "R": return "collares"; break;
                case "V": return "accesorios"; break;
            }
        }
    },

    translation_material: {
        spanish: (material) => {
            switch (material) {
                case "gold": return "oro"; break;
                case "silver": return "plata"; break;
                case "steel": return "acero"; break;
                default: return null; break;
            }
        }
    }

};

export default filterHelper;