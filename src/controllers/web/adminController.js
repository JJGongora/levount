import clientModel from "../../models/clientModel.js";
import { methods as utils } from "../../../public/js/utils.js";
import storesModel from "../../models/storesModel.js";
import productModel from "../../models/productModel.js";
import countries from "country-list";
import shapeModel from "../../models/shapeModel.js";
import filterHelper from "../../utils/filterHelper.js";
import authModel from "../../models/authModel.js";
import userModel from "../../models/userModel.js";

const Today = new Date();
const pageTitle = `Administración Le Vount`;

const adminController = {

    clients: async(req, res, next) => {
        try {
            const clients = await clientModel.getClients({registeredDate: Today});

            return res.render('pages/admin/clients', {
                title: `${ pageTitle } | Clientes`,
                page: 'clients',
                utils, Today, clients
            });
        } catch (error) {
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
    }

};

export default adminController;