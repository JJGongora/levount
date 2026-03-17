import clientModel from "../../models/clientModel.js";
import { methods as utils } from "../../../public/js/utils.js";
import storesModel from "../../models/storesModel.js";
import productModel from "../../models/productModel.js";
import countries from "country-list";
import shapeModel from "../../models/shapeModel.js";
import filterHelper from "../../utils/filterHelper.js";
import authModel from "../../models/authModel.js";
import userModel from "../../models/userModel.js";
import utilities from "../../utils/utilities.js";
import documentModel from "../../models/documentModel.js";

const Today = new Date();
const pageTitle = `Administración Le Vount`;

const adminController = {

    clients: async(req, res, next) => {
        try {
            let filters = req?.query;
            //if (!filters?.captured) { filters.captured = utils.dateToInputDate(Today); }
            let clients = await clientModel.getClients(filters); //console.log(clients);

            const pag = clients?.pagination || { page: 1, limit: 30, totalItems: 0 };
            let startItem = 0;
            let endItem = 0;

            if (pag.totalItems > 0) {
                startItem = (pag.page - 1) * pag.limit + 1;
                endItem = Math.min(pag.page * pag.limit, pag.totalItems); 
            }
            if (clients.pagination) {
                clients.pagination.startItem = startItem;
                clients.pagination.endItem = endItem;
                clients.pagination.pagesArray = utilities.generatePaginationArray(pag.page, pag.totalPages);
            }

            return res.render('pages/admin/clients', {
                title: `Clientes | ${ pageTitle }`,
                page: 'clients',
                utils, Today, clients, filters
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    client: async(req, res, next) => {
        try {
            let clientData = await clientModel.getClients({id: req?.params?.id}); //console.log(clientData);
            return res.render('pages/admin/client', {
                title: `Cliente | ${ pageTitle }`,
                page: 'clients',
                utils, Today, clientData
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    createClient: async(req, res, next) => {
        try {
            const branches = await storesModel.getAll();
            return res.render('pages/admin/new-client', {
                title: `${ pageTitle } | Nuevo cliente`,
                page: 'new-client',
                utils, Today, branches, countries: countries.getData()
            });
        } catch (error) {
            next(error);
        }
    },

    products: {
        create: async(req, res, next) => {
            //console.log(res?.locals?.userSession);
            
            const shapes = await shapeModel.getShapes();

            try {
                return res.render('pages/admin/product', {
                    title: `Nuevo producto | ${ pageTitle }`,
                    page: 'new-product',
                    utils, Today, shapes, product: null, isProductUpdate: false,
                    filterHelper
                });
            } catch (error) {
                next(error);
            }
        },
        get: async(req, res, next) => {
            try {
                const shapes = await shapeModel.getShapes();
                const product = await productModel.getProducts({productSku: req?.params?.sku, isAdmin: true}); //console.log(product);

                return res.render('pages/admin/product', {
                    title: `Productos | ${product?.sku} | ${pageTitle}`,
                    page: 'products',
                    utils, Today, shapes, product, isProductUpdate: true,
                    filterHelper
                });
            } catch (error) {
                next(error);
            }
        },
        getAll: async(req, res, next) => {
            try {
                const { category, page, limit, stoneColor, material, sort = 'latest', tags, classification, code } = { ...req.query, ...req.params };
                let filters = {
                    page, limit, stoneColor, material, sort, category, tags, classification, isAdmin: true, code
                }
                const productsPromise = productModel.getProducts(filters);
                const colorsPromise = productModel.getAvailableAttributes(category, "pv.stoneColor", filters);
                const materialsPromise = productModel.getAvailableAttributes(category, "p.material", filters);
                const classificationsPromise = productModel.getAvailableAttributes(category, "pv.classification", filters);

                const [products, rawColors, rawMaterials, rawClassifications] = await Promise.all([
                    productsPromise, colorsPromise, materialsPromise, classificationsPromise
                ]); //console.log(products);
                
                let buttonsRange = 2;
                let stringSort = "";
                switch (sort) {
                    case "priceLow": stringSort = "Price (low to high)"; break;
                    case "priceHigh": stringSort = "Price (high to low)"; break;
                    case "material": stringSort = "Material"; break;
                    case "latest": stringSort = "Latest"; break;
                    default: stringSort = null; break;
                }
                const sorting = {sort, stringSort};

                const colors = filterHelper.processFilters(rawColors);
                const materials = filterHelper.processFilters(rawMaterials);
                const classifications = filterHelper.processFilters(rawClassifications);

                return res.render('pages/admin/products', {
                    title: `Productos | ${ pageTitle }`,
                    page: 'products',
                    utils, Today, filterHelper,
                    products, buttonsRange, filters, sorting,
                    availableParams: {
                        colors, materials, classifications
                    },
                });
            } catch (error) {
                next(error);
            }
        }
    },

    users: {
        get: async(req, res, next) => {
            try {
                const roles = await authModel.getRoles();
                const users = await userModel.getAll(); //console.log(users);
                return res.render('pages/admin/users', {
                    title: `Usuarios | ${ pageTitle }`,
                    page: 'users',
                    utils, Today, roles, users
                });
            } catch (error) {
                next(error);
            }
        },

        getIndividual: async(req, res, next) => {
            try {
                const roles = await authModel.getRoles();
                const branches = await storesModel.getAll();
                const user = await userModel.getAllUserData(req?.params?.id); //console.log(user);
                return res.render('pages/admin/user', {
                    title: `Usuario: ${user?.displayName} | ${ pageTitle }`,
                    page: 'users',
                    utils, Today, roles, branches, user
                });
            } catch (error) {
                next(error);
            }
        }
    },

    labels: {
        get: async(req, res, next) => {
            try {
                return res.render('pages/admin/labels', {
                    title: `Etiquetas | ${ pageTitle }`,
                    page: 'users',
                    utils, Today
                });
            } catch (error) {
                next(error);
            }
        }
    },

    sales: {
        get: async(req, res, next) => {
            try {
                const branches = await storesModel.getAll();
                const document = await documentModel.getAllData({documentType: 'sale', id: req?.params?.id});
                //console.log(document);
                return res.render('pages/admin/sale', {
                    title: `Venta | ${ pageTitle }`,
                    page: 'sale',
                    utils, Today, branches, countries: countries.getData(), document
                });
            } catch (error) {
                next(error);
            }
        }
    }

};

export default adminController;