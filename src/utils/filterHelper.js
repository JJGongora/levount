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
            let value = data[key];
            if (typeof value === 'object' && value !== null) {
                this.cleanEmptyFields(value);
            } 
            else {
                if (typeof value === 'string' && value.trim() === '') {
                    data[key] = null;
                }
                else if (value == 0) {
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

};

export default filterHelper;