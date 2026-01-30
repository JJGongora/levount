import db from '../config/db.js';

const storesModel = {

    getAll: async() => {
        const query = `
            SELECT *
            FROM stores
            WHERE id <> 0
        `;
        const [result] = await db.query(query);
        return result;
    },

    getBranchName: async(branchId) => {
        const query = `
            SELECT location
            FROM stores
            WHERE id = ?
        `;
        const [result] = await db.query(query, [branchId]);
        return result?.[0]?.location || null;
    }

};

export default storesModel;