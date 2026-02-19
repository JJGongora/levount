import appError from "../utils/appError.js";

const parseValue = (value) => {
    if (value == null || value == undefined) return value;
    if (typeof value == 'object') {
        Object.keys(value).forEach(key => {
            value[key] = parseValue(value[key]);
        });
        return value;
    }
    if (typeof value != 'string') return value;
    const cleanValue = value.trim();
    if (cleanValue == 'null') return null;
    if (cleanValue == 'undefined') return undefined;
    if (cleanValue == 'true') return true;
    if (cleanValue == 'false') return false;
    if (cleanValue != '' && !isNaN(cleanValue)) {
        return Number(cleanValue);
    } //console.log(cleanValue);
    return cleanValue;
};

const queryParser = (req, res, next) => {
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            
            req.query[key] = parseValue(req.query[key]);
            console.log(parseValue(req.query[key]));
        });
    }
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            req.params[key] = parseValue(req.params[key]);
        });
    }
    next();
};

export default queryParser;