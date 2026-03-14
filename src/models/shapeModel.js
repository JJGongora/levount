import db from "../config/db.js";
import appError from "../utils/appError.js";
import { methods as utils } from "../../public/js/utils.js";
import filterHelper from "../utils/filterHelper.js";

const shapeModel = {

    getShapes: async() => {
        let query = `
            SELECT * FROM
                pieceShape
        `;
        const [result] = await db.query(query);
        return result;        
    },

};

export default shapeModel;