import storesModel from "../../models/storesModel.js";
import { methods as utils } from "../../../public/js/utils.js";
import clientModel from "../../models/clientModel.js";
import productModel from "../../models/productModel.js";
import appError from "../../utils/appError.js";
import filterHelper from "../../utils/filterHelper.js";
import apiController from "../api/apiController.js";
import cartModel from "../../models/cartModel.js";
import countries from "country-list";

const pageTitle = process?.env?.FRONT_TITLE || "New project";
const Today = new Date();

const pageController = {

    home: async (req, res, next) => {
        try {
            //console.log(res.locals, req?.headers?.['x-forwarded-for']);
            res.render('pages/webstore/home', {
                title: 'Le Vount Jewelry | Luxury Handcrafted Jewelry & Fine Diamonds',
                page: 'home',
                userSession: res.locals.userSession,
                outstProducts: await productModel.getProducts({outstanding: true, storeId: 0}),
                utils,
                Turnstile: process.env.TURNSTILE_SITE,
                metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                currentUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
                socialImage: "/LeVount/images/og/og-image-001.jpg"
            });
        } catch (error) {
            next(error);
        }
    },

    products: async (req, res, next) => {
        try {
            const { category, page, limit, stoneColor, material, sort = 'latest' } = { ...req.query, ...req.params };
            const active = 0;
            let filters = {
                page, limit, stoneColor, material, sort, category, active, storeId: 0
            }
            const productsPromise = productModel.getProducts(filters);
            const colorsPromise = productModel.getAvailableAttributes(category, "pv.stoneColor", filters);
            const materialsPromise = productModel.getAvailableAttributes(category, "p.material", filters);

            const [products, rawColors, rawMaterials] = await Promise.all([
                productsPromise, colorsPromise, materialsPromise
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

            res.render('pages/webstore/products',
                {
                    title: `Le Vount Jewelry | ${utils.capitalizeFirstLetter(category) || 'Products'}`,
                    page: 'products',
                    userSession: res.locals.userSession,
                    utils,
                    products, buttonsRange, filters, sorting,
                    availableParams: {
                        colors, materials
                    },
                    metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                    currentUrl: 'https://levount.com' + req.originalUrl,
                    socialImage: "/LeVount/images/og/og-image-001.jpg"
                }
            );
        } catch (error) {
            next(error);
        }
    },

    product: async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await productModel.getProducts({productSku: id, storeId: 0}); //console.log(product);

            if (product?.active == 0 || !product) { return next(new appError("This product is not still available.", 404)); }

            res.render('pages/webstore/product',
                {
                    title: `Le Vount Jewelry | ${utils.capitalizeFirstLetter(product?.category)} | ${id}`,
                    page: 'product',
                    userSession: res.locals.userSession,
                    utils,
                    product,
                    metaDescription: utils.capitalizeFirstLetter(product?.description),
                    currentUrl: 'https://levount.com' + req.originalUrl,
                    socialImage: `/LeVount/images/products/${ product?.material }/${ product?.category }/${ product?.sku }/${ product?.sku?.toLowerCase() }-large.webp`
                }
            );
        } catch (error) {
            next(error);
        }
    },

    privacy: async(req, res, next) => {
        try {
            res.render('pages/webstore/privacy',
                {
                    title: `Le Vount Jewelry | Privacy Policy`, 
                    userSession: res.locals.userSession, 
                    utils,
                    metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                    currentUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
                    socialImage: "/LeVount/images/og/og-image-001.jpg",
                    page: 'privacy'
                }
            );
        } catch (error) {
            next(error);
        }
    },

    terms: async(req, res, next) => {
        try {
            res.render('pages/webstore/terms',
                {
                    title: `Le Vount Jewelry | Terms of Service`, 
                    userSession: res.locals.userSession, 
                    utils,
                    metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                    currentUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
                    socialImage: "/LeVount/images/og/og-image-001.jpg",
                    page: 'terms'
                }
            );
        } catch (error) {
            next(error);
        }
    },

    checkout: async(req, res, next) => {
        try {
            const { environment } = req?.params;
            const ppClientId = (environment == 'sandbox')
                ? process.env.PP_CLIENT_SAND
                : process.env.PP_CLIENT_LIVE; //console.log(ppClientId);
            if(environment == 'sandbox' && !res?.locals?.userSession?.permissions?.includes("checkout:sandbox")) {
                return next(new appError("Access denied.", 403));
            }

            const items = await cartModel.getCartItems(req?.cartSession);
            if (items?.items?.length < 1) { return res.redirect("/"); }
            
            res.render('pages/webstore/checkout',
                {
                    title: `Le Vount Jewelry | Checkout`, 
                    utils,
                    metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                    currentUrl: req?.protocol + '://' + req?.get('host') + req?.originalUrl,
                    socialImage: "/LeVount/images/og/og-image-001.jpg",
                    page: 'checkout',
                    ppClient: ppClientId || null,
                    items
                }
            );
        } catch (error) {
            next(error);
        }
    },

    thanks: async(req, res, next) => {
        try {
            const { orderId } = req?.params;
            
            if (orderId) {
                const orderDataFetch = await fetch(`https://core.levount.com/orders/${orderId}` , {
                    method: 'get',
                    headers: { 'Accept': 'application/json' }
                });
                const orderData = await orderDataFetch.json();

                if (!orderData.order) {
                    return res.redirect("/");
                } else {
                    res.clearCookie('cartSession');
                    res.render('pages/webstore/thanks' , {
                        title: `Le Vount Jewelry | Thanks`, 
                        userSession: res?.locals?.userSession, 
                        utils,
                        metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                        currentUrl: req?.protocol + '://' + req?.get('host') + req?.originalUrl,
                        socialImage: "/LeVount/images/og/og-image-001.jpg",
                        page: 'thanks',
                        orderData: orderData?.order
                    });
                }                
            } else {
                return res.redirect("/");
            }

        } catch (error) {
            next(error);
        }
    },

};

export default pageController;