import db from "../config/db.js";
import appError from "../utils/appError.js";
import { methods as utils } from "../../public/js/utils.js";
import filterHelper from "../utils/filterHelper.js";
import translations from "../../../SilverBestPrice/src/utils/translations.js";

const productModel = {

    getProducts: async(filters) => {
        let limit = filters?.limit ? parseInt(filters?.limit) : 30;
        const page = filters?.page ? parseInt(filters?.page) : 1;
        const offset = (page - 1) * limit; //console.log(filters);
        
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
        } if (filters?.tags) {
            const tagList = filters.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

            if (tagList.length > 0) {
                const tagsLikeQueries = tagList.map(() => "pv.tags LIKE ? OR pv.tags LIKE ?");
                conditions.push(`(${tagsLikeQueries.join(" OR ")})`);                
                tagList.forEach(tag => {
                    params.push(`%,${tag}%`);
                    params.push(`${tag}%`);
                });
            }
        } if (filters?.classification) {
            const classificationList = filters.classification.split(',').map(classification => classification.trim()).filter(classification => classification !== '');

            if (classificationList.length > 0) {
                const tagsLikeQueries = classificationList.map(() => "pv.classification LIKE ? OR pv.classification LIKE ?");
                conditions.push(`(${tagsLikeQueries.join(" OR ")})`);                
                classificationList.forEach(classification => {
                    params.push(`${classification}%`);
                    params.push(`%,${classification}%`);
                });
            }
        } if (filters?.code) {
            conditions.push("p.sku LIKE ? OR p.levountCode LIKE ? OR p.alternateCode LIKE ?");
            params.push(`%${filters?.code}%`);
            params.push(`%${filters?.code}%`);
            params.push(`%${filters?.code}%`);
        }

        // ====================================
        //          Filtro del buscador
        // ====================================
        if (filters?.search) {

            const searchWords = filters?.search?.trim()?.split(/\s+/); // Se separan las palabras ingresadas en el buscador.
            
            searchWords?.forEach(word => { // Por cada palabra ingresada...
                const searchTerm = `%${word}%`

                conditions.push(`
                    (p.sku LIKE ? OR    
                    p.levountCode LIKE ? OR    
                    p.alternateCode LIKE ? OR 
                    p.material LIKE ? OR    
                    p.purity LIKE ? OR    
                    p.name LIKE ? OR    
                    p.description LIKE ? OR   

                    pv.stoneColor LIKE ? OR    
                    pv.classification LIKE ? OR    
                    pv.name LIKE ? OR    
                    pv.shortName LIKE ? OR
                    pv.category LIKE ? OR
                    pv.tags LIKE ? OR
                    pv.gems LIKE ? OR    
                    pv.description LIKE ? OR    
                    pv.gems LIKE ?)
                `);

                for (let i=0; i < 16; i++) { // Se inserta el término de búsqueda una vez por cada columna en la que se buscará.
                    params.push(searchTerm);
                };
            });           

        }


        let isAggregated = false;
        if(filters?.storeId != null) { // Se pone el comparador '!= null' porque Le Vount tiene el id 0.
            conditions.push(`pv.storeId = ?`);
            params.push(filters?.storeId);
            isAggregated = true;
        }

        let whereClause = "";
        if (conditions.length > 0) {
            whereClause = " WHERE " + conditions.join(" AND ");  
        }

        const adminVariables = (filters?.isAdmin)
            ? `
                p.registeredBy,
                p.registeredDate,
                p.editedBy,
                p.lastEdition,
                p.weight,
                p.locationStore,
                p.line,
                p.cost,
                p.shape,
                p.name,
                p.description,
                p.family,
                p.tagPrice,
                p.tagPriceMxn,
                p.alternateCode,
                p.levountCode,
            `
            : ``;

        let query = `
                SELECT 
                    p.id,
                    p.sku,
                    p.purity,
                    p.material,
                    ${adminVariables}
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'stoneColor', pv.stoneColor,
                            'classification', pv.classification,
                            'name', pv.name,
                            'shortName', pv.shortName,
                            'tagPrice', pv.tagPrice,
                            'discountPrice', pv.discountPrice,
                            'finalUnitPrice', CEILING(COALESCE(NULLIF(pv.discountPrice, 0), pv.tagPrice)),
                            'category', pv.category,
                            'tags', pv.tags,
                            'gems', pv.gems,
                            'description', pv.description,
                            'outstanding', pv.outstanding,
                            'seoDescription', pv.seoDescription,
                            'seoTitle', pv.seoTitle,
                            'discountPercentage', pv.discountPercentage,
                            'currency', pv.currency
                        )
                    ) as variants
                FROM products p
                LEFT JOIN productVariants pv 
                    ON pv.productId = p.id
                ${whereClause}
                GROUP BY 
                    p.id, p.sku, p.purity, p.material
                ORDER BY 
                    ${sort}id ASC
                LIMIT ? OFFSET ?;
        `; //console.log(query, params);
        const paramsQuery = [...params, limit, offset]; //console.log(paramsQuery);

        const sqlCount = `SELECT COUNT(DISTINCT p.id) as total FROM products p LEFT JOIN productVariants pv ON pv.productId = p.id ${whereClause}`;
        const paramsCount = [...params];

        const [result, countResult] = await Promise.all([
            db.query(query, paramsQuery),
            db.query(sqlCount, paramsCount)
        ]);

        const parsedProducts = result[0].map(product => {
            let parsedVariants = [];
            if (product.variants) {
                parsedVariants = typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants;
            }

            return {
                ...product,
                variants: parsedVariants
            };
        });

        const totalItems = countResult[0][0].total || 0;

        return (!filters?.productSku) 
            ? {
                products: parsedProducts,
                pagination: {
                    page: page,
                    limit: limit,
                    totalItems: totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                }
            }
            : parsedProducts[0];
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

        if (category) {
            conditions.push("category LIKE ?");
            params.push(`%${category}%`);
        }

        if (filters?.storeId) {
            conditions.push(`pv.storeId = ?`);
            params.push(filters?.storeId);
        }
        

        let whereClause = "";
        if (conditions.length > 0) {
            whereClause = " WHERE " + conditions.join(" AND ");
        }

        const allowedColumns = ['p.material', 'pv.stoneColor', 'pv.gems', 'pv.category', 'pv.tags', 'pv.classification'];
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
    },

    create: async(data, username) => {
        let connection;
        
        try {
            const responseSteps = [];
            
            connection = await db.getConnection();
            await connection.beginTransaction();

            /*const validateSkuQuery = `SELECT sku FROM products WHERE sku = ?`;
            const [validateSkuResult] = await connection.query(validateSkuQuery, [data?.sku?.toLowerCase()]);
            
            if(validateSkuResult?.length > 0) {
                throw(new appError("Este SKU ya existe. Por favor, ingrese uno diferente.", 400));
            } else {*/

                const insertProductQuery = `
                    INSERT INTO 
                        products
                            (
                                sku, registeredBy, registeredDate, editedBy, lastEdition,
                                weight, levountCode, alternateCode, material, purity,
                                line, tagPrice, cost, shape, name, description, tagPriceMxn,
                                family
                            )
                    VALUES
                        (
                            ?, ?, NOW(), ?, NOW(),
                            ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?,
                            ?
                        )
                    ON DUPLICATE KEY UPDATE
                        editedBy        = COALESCE(VALUES(editedBy), editedBy),
                        lastEdition     = COALESCE(VALUES(lastEdition), lastEdition),

                        weight          = COALESCE(VALUES(weight), weight),
                        levountCode     = COALESCE(VALUES(levountCode), levountCode),
                        alternateCode   = COALESCE(VALUES(alternateCode), alternateCode),
                        material        = COALESCE(VALUES(material), material),
                        purity          = COALESCE(VALUES(purity), purity),

                        line            = COALESCE(VALUES(line), line),
                        tagPrice        = COALESCE(VALUES(tagPrice), tagPrice),
                        cost            = COALESCE(VALUES(cost), cost),
                        shape           = COALESCE(VALUES(shape), shape),
                        name            = COALESCE(VALUES(name), name),
                        description     = COALESCE(VALUES(description), description),
                        tagPriceMxn     = COALESCE(VALUES(tagPriceMxn), tagPriceMxn),
                        
                        family          = COALESCE(VALUES(family), family)
                `;
                const insertProductValues = [
                    data?.sku?.toLowerCase(),
                    username || 'System',
                    username || 'System',

                    data?.weight,
                    data?.levountCode?.toLowerCase(),
                    data?.alternateCode?.toLowerCase(),
                    data?.material?.toLowerCase(),
                    data?.purity?.toLowerCase(),

                    data?.line?.toLowerCase(),
                    data?.tagPrice,
                    data?.cost,
                    data?.shape?.toLowerCase(),
                    data?.name?.toLowerCase(),
                    data?.description?.toLowerCase(),
                    data?.tagPriceMxn,
                    data?.family?.toLowerCase()
                ];
                const [insertProductResult] = await connection.query(insertProductQuery, insertProductValues); //console.log(insertProductResult);
                const productId = insertProductResult?.insertId;
                responseSteps.push(filterHelper.dbResultStatus(insertProductResult, `el producto`));

                //console.log("\n\n====================\n", data);

                for (const store of (data?.stores || [])) {    
                    //console.log("\n====================\n", store);

                    let storeId;
                    if (store?.storeId == false || store?.storeId == 0 || store?.storeId == '0') { 
                        storeId = 0; 
                    } else if (store?.storeId == true || store?.storeId == 1 || store?.storeId == '1') { 
                        storeId = 1; 
                    }

                    if (data?.publish?.[storeId]) {

                        const insertVariantQuery = `
                            INSERT INTO productVariants
                                (
                                    productId, storeId, stoneColor, classification,
                                    name, tagPrice, currency, discountPercentage,
                                    category, tags, gems, description,
                                    editedBy, lastEdition, outstanding, status,
                                    seoDescription, seoTitle
                                )
                            VALUES
                                (
                                    ?, ?, ?, ?,
                                    ?, ?, ?, ?,
                                    ?, ?, ?, ?,
                                    ?, NOW(), ?, ?,
                                    ?, ?
                                )
                            ON DUPLICATE KEY UPDATE
                                stoneColor          = COALESCE(VALUES(stoneColor), stoneColor),
                                classification      = COALESCE(VALUES(classification), classification),
                                name                = COALESCE(VALUES(name), name),
                                tagPrice            = COALESCE(VALUES(tagPrice), tagPrice),
                                currency            = COALESCE(VALUES(currency), currency),
                                discountPercentage  = COALESCE(VALUES(discountPercentage), discountPercentage),
                                category            = COALESCE(VALUES(category), category),
                                tags                = COALESCE(VALUES(tags), tags),
                                gems                = COALESCE(VALUES(gems), gems),
                                description         = COALESCE(VALUES(description), description),
                                editedBy            = COALESCE(VALUES(editedBy), editedBy),
                                lastEdition         = COALESCE(VALUES(lastEdition), lastEdition),
                                outstanding         = VALUES(outstanding),
                                status              = COALESCE(VALUES(status), status),
                                seoDescription      = COALESCE(VALUES(seoDescription), seoDescription),
                                seoTitle            = COALESCE(VALUES(seoTitle), seoTitle)
                        `;
                        const insertVariantValues = [
                            productId, 
                            storeId, 
                            store?.stoneColor?.toLowerCase(), 
                            store?.classification?.toLowerCase(),

                            store?.name?.toLowerCase(), 
                            store?.tagPrice || ((storeId == 0) ? data?.tagPrice : data?.tagPriceMxn), 
                            (storeId == 0) ? `usd` : `mxn`,
                            store?.discountPercentage,

                            filterHelper.shapeToCategory.english(data?.shape),
                            store?.tags?.toLowerCase(), 
                            store?.gems?.toLowerCase(), 
                            store?.description?.toLowerCase(),
                            
                            username, 
                            store?.outstanding, 
                            store?.status || 'Active',

                            store?.seoDescription,
                            store?.seoTitle
                        ];

                        const [insertVariantResult] = await connection.query(insertVariantQuery, insertVariantValues);
                        const responseString = /*(insertVariantResult.affectedRows == 1)
                            ? {
                                step: 'producto', 
                                status: "success", 
                                message: `El producto se ha añadido a ${store?.storeName}.`
                            }
                            : {
                                step: 'producto', 
                                status: "failed", 
                                message: `El producto no se ha añadido a ${store?.storeName}.`
                            };*/
                            filterHelper.dbResultStatus(insertVariantResult, 'la variante');
                        responseSteps.push(responseString);
                    }
                }

            //}

            await connection.commit();
            return responseSteps;
        } catch (error) {
            await connection.rollback();
            throw(new appError(`<b>Error en el modelo de creación de productos: </b> ${error.message}`, error.statusCode));
        } finally {
            if (connection) connection.release();
        }
    },

};

export default productModel;