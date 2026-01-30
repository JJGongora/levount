import db from "../config/db.js";
import appError from "../utils/appError.js";

const orderModel = {

    getOrder: async(saleId) => {
        const query = `
            SELECT 
                s.*,
                c.name,
                c.lastName,
                c.address,
                c.clientEmail,
                c.clientTel,
                c.clientCountry,
                c.clientState,
                st.name as storeName
            FROM
                sales s
                LEFT JOIN clients c ON c.id = s.clientId
                LEFT JOIN stores st ON s.storeId = st.id
            WHERE
                s.id = ?
        `;
        const [result] = await db.query(query, [saleId]);
        return result[0];
    },

};

export default orderModel;