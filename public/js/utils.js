function dateToInputDate(date) {
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate;
    } catch (error) {
        throw error;
    }
}

function toTitleCase(phrase, customExceptions = []) {
    if (!phrase) return "";

    const defaultExceptions = [
        'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 
        'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with',
        'cultured', 'cultivated', 'de', 'del', 'la', 'las', 'le', 'les', 'van', 'von'
    ];
    // Combinamos las excepciones por defecto con las que tú envíes (si las hay)
    const exceptions = [...defaultExceptions, ...customExceptions];

    // 2. Convertimos todo a minúsculas y separamos por espacios
    return phrase.toLowerCase().split(' ').map((word, index) => {
        if (index === 0 || !exceptions.includes(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
    }).join(' ');
}

function getFlagEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function toCurrency(number) {
    try {
        return `$${parseFloat(number).toLocaleString("es-MX")}`;
    } catch (error) {
        throw error;
    }
}

function capitalize(value) {
    try {
        if (!value) return null;

        return value
            .toLowerCase() // 1. Todo a minúsculas
            .replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase()); // 2. Detectar y mayuscular

    } catch (error) {
        throw error;
    }
}

function capitalizeFirstLetter(value) {
    try {
        if (!value) {return null;}

        return value
            .charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    } catch (error) {
        throw error;
    }
}

export const methods = {
    dateToInputDate, toTitleCase, getFlagEmoji, toCurrency, capitalize, capitalizeFirstLetter
};