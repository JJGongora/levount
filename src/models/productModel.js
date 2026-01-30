import db from "../config/db.js";
import appError from "../utils/appError.js";

const productModel = {

    getProducts: async(filters) => {
        const limit = filters?.limit ? parseInt(filters?.limit) : 30;
        const page = filters?.page ? parseInt(filters?.page) : 1;
        const offset = (page - 1) * limit;

        let conditions = []; let params = [];
        let sort = "";

        if (filters?.productSku) {
            conditions.push("p.sku LIKE ?");
            params.push(`${filters.productSku}`);
        } if (filters?.outstanding) {
            conditions.push("pv.outstanding = ?");
            params.push(`1`);
        } if (filters?.category) {
            conditions.push("pv.category = ?");
            params.push(filters?.category);
        } if (filters?.stoneColor) {
            conditions.push("pv.stoneColor LIKE ?");
            params.push(`%${filters?.stoneColor}%`);
        } if (filters?.material) {
            conditions.push("p.material LIKE ?");
            params.push(`%${filters?.material}%`);
        } if (filters?.active != null) {
            conditions.push(`(pv.status <> "inactive" OR pv.status IS NULL)`);
        } if (filters?.sort) {
            switch (filters.sort) {
                case "priceLow": sort = "pv.tagPrice ASC, "; break;
                case "priceHigh": sort = "pv.tagPrice DESC, "; break;
                case "material": sort = "p.material ASC, "; break;
                case "latest": sort = "p.registeredDate DESC, "; break;
            }
        }

        conditions.push(`pv.storeId = ?`);
        params.push(filters?.storeId);

        let whereClause = "";
        if (conditions.length > 0) {
            whereClause = " WHERE " + conditions.join(" AND ");  
        }

        let query = `
                SELECT 
                    p.id,
                    p.sku,
                    p.purity,
                    p. material,
                    pv.stoneColor,
                    pv.classification,
                    pv.name,
                    pv.shortName,
                    pv.tagPrice,
                    pv.discountPrice,
                    CEILING(COALESCE(NULLIF(pv.discountPrice, 0), pv.tagPrice)) as finalUnitPrice,
                    pv.category,
                    pv.tags,
                    pv.gems,
                    pv.description,
                    pv.outstanding
                FROM products p
                    LEFT JOIN productVariants pv 
                        ON pv.productId = p.id
                ${whereClause}
                ORDER BY 
                    ${sort}id ASC LIMIT ? OFFSET ?
        `; //console.log(query);
        const paramsQuery = [...params, limit, offset]; //console.log(paramsQuery);

        const sqlCount = `SELECT COUNT(*) as total FROM products p LEFT JOIN productVariants pv ON pv.productId = p.id ${whereClause}`;
        const paramsCount = [...params];

        const [result, countResult] = await Promise.all([
            db.query(query, paramsQuery),
            db.query(sqlCount, paramsCount)
        ]);

        const totalItems = countResult[0][0].total || 0
        return (!filters?.productSku) 
            ? {
                products: result[0],
                    pagination: {
                        page: page,
                        limit: limit,
                        totalItems: totalItems,
                        totalPages: Math.ceil(totalItems / limit)
                    }
            }: result[0][0];
    },

    getAvailableAttributes: async(category, columnName, filters) => {
        let conditions = []; let params = [];
    
        /*if (filters?.stoneColor) {
            conditions.push("stoneColor LIKE ?");
            params.push(`%${filters?.stoneColor}%`);
        } if (filters?.material) {
            conditions.push("productMaterial LIKE ?");
            params.push(`%${filters?.material}%`);
        } */

        conditions.push("category LIKE ?");
        params.push(`%${category}%`);

        let whereClause = "";
        if (conditions.length > 0) {
            whereClause = " WHERE " + conditions.join(" AND ");
        }

        const allowedColumns = ['p.material', 'pv.stoneColor', 'pv.gems', 'pv.category'];
        if (!allowedColumns.includes(columnName)) {
            throw new appError("This column it's not allowed to be filtered by.", 403);
        }
        const paramsQuery = [...params, category];
        const query = `
            SELECT DISTINCT ${columnName} as value 
            FROM products p, productVariants pv
            ${whereClause}
            ORDER BY ${columnName} ASC
        `;
        const [rows] = await db.query(query, paramsQuery);
        return rows.map(row => row.value).filter(val => val !== null);
    }

};

export default productModel;