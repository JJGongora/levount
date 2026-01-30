import db from "../config/db.js";

const cartModel = {
    getCartItems: async(sessionId) => {
        
        const query = `
            SELECT 

                ci.quantity,
                p.id,
                p.sku,
                p.weight,
                p.material,
                p.purity,
                pv.name, 
                pv.shortName,
                pv.category,
                pv.tagPrice,
                CEILING(COALESCE(NULLIF(pv.discountPrice, 0), pv.tagPrice)) as finalUnitPrice,
                (ci.quantity * CEILING(COALESCE(NULLIF(pv.discountPrice, 0), pv.tagPrice))) as rowTotal

            FROM cartItems ci
                JOIN carts c ON c.id = ci.cartId
                JOIN products p ON p.sku = ci.productSku
                JOIN productVariants pv ON pv.productId = p.id AND pv.storeId = c.storeId
            
            WHERE c.sessionId = ?
        `;
        const [items] = await db.query(query, [sessionId]);

        let subtotal = 0;
        items.forEach(item => {
            subtotal += parseInt(item?.rowTotal);
        });

        const storeId = await cartModel.getCartSession(sessionId); //console.log(storeId?.[0]?.storeId);
        return { items, subtotal, storeId: storeId?.[0]?.storeId };
    },

    getCartSession: async(id) => {
        const query = `SELECT id, storeId FROM carts WHERE sessionId = ?`;
        const result = await db.query(query, [id]);
        return result[0];
    },

    createCart: async(id, store) => {
        const query = `INSERT INTO carts (sessionId, storeId) VALUES (?, ?)`;
        const result = await db.query(query, [id, store]);
        return result[0].insertId;
    },

    addToCart: async(cartId, productSku, quantity) => {
        let qty = parseInt(quantity) || 1;
        const query = `
            INSERT INTO cartItems (cartId, productSku, quantity)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE quantity = quantity + ?
        `;
        const [result] = await db.query(query, [cartId, productSku, qty, qty]);
        await db.query(`DELETE FROM cartItems WHERE cartId = ? AND quantity <= 0`, [cartId]); //Limpia los items cuyo valor sea 0.
        const updtQuery = `SELECT SUM(quantity) as total FROM cartItems WHERE cartId = ?`;
        const [updtResult] = await db.query(updtQuery, [cartId]);
        return { 
            success: (result.affectedRows > 0) ? true : false,
            addedItems: (result.affectedRows > 0) ? parseInt(qty) : 0,
            totalItems: parseInt(updtResult[0].total),
            message: (result.affectedRows > 0) ? "Successfully added items." : "This item doesn't exist."
        };
    },

    deleteFromCart: async(cartId, productSku, quantity) => {
        let qty = parseInt(quantity) || 1; //console.log("\n\n\n", quantity);
        let query = ""; let result = [];
        if(quantity) {
            query = `
                UPDATE cartItems
                    SET quantity = GREATEST(0, quantity - ?)
                WHERE
                    cartId = ? AND productSku = ?
            `;
            [result] = await db.query(query, [qty, cartId, productSku]);
            await db.query(`DELETE FROM cartItems WHERE cartId = ? AND quantity <= 0`, [cartId]); //Limpia los items cuyo valor sea 0.
        } else {
            query = `
                DELETE FROM cartItems
                WHERE
                    cartId = ?
                    AND productSku = ?
            `;
            [result] = await db.query(query, [cartId, productSku]);
        }

        const updtQuery = `SELECT SUM(quantity) as total FROM cartItems WHERE cartId = ?`;
        const [updtResult] = await db.query(updtQuery, [cartId]);
        return { 
            success: (result.affectedRows > 0) ? true : false,
            totalItems: parseInt(updtResult[0].total),
            deletedItems: (result.affectedRows > 0) ? parseInt(qty) : 0,
            message: (result.affectedRows > 0) ? "Successfully deleted items." : "This item is not in this cart."
        };
    },

    deleteCart: async(cartId) => {
        const query = `DELETE FROM carts WHERE sessionId = ?`;
        const result = await db.query(query, [cartId]);
        return result[0];
    },
}

export default cartModel;