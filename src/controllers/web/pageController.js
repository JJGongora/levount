import storesModel from "../../models/storesModel.js";
import { methods as utils } from "../../../public/js/utils.js";
import clientModel from "../../models/clientModel.js";
import productModel from "../../models/productModel.js";
import appError from "../../utils/appError.js";
import filterHelper from "../../utils/filterHelper.js";
import apiController from "../api/apiController.js";
import cartModel from "../../models/cartModel.js";
import countries from "country-list";
import orderModel from "../../models/orderModel.js";

const pageTitle = process?.env?.FRONT_TITLE || "New project";
const Today = new Date();

const pageController = {

    home: async (req, res, next) => {
        try {
            res.render('pages/webstore/home', {
                title: 'Le Vount Jewelry | Luxury Handcrafted Jewelry & Fine Diamonds',
                page: 'home',
                userSession: res.locals.userSession,
                outstProducts: await productModel.getProducts({outstanding: true, storeId: 0, sort: "latest"}),
                utils,
                Turnstile: process.env.TURNSTILE_SITE,
                metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                currentUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
                socialImage: "https://assets.levount.com/images/og/og-image-001.jpg"
            });
        } catch (error) {
            next(error);
        }
    },

    products: async (req, res, next) => {
        try {
            const { category, page, limit, stoneColor, material, sort = 'latest', tags, classification } = { ...req.query, ...req.params };
            const active = 0;
            let filters = {
                page, limit, stoneColor, material, sort, category, active, storeId: 0, tags, classification
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

            res.render('pages/webstore/products',
                {
                    title: `Le Vount Jewelry | ${utils.capitalizeFirstLetter(category) || 'Products'}`,
                    page: 'products',
                    userSession: res.locals.userSession,
                    utils,
                    products, buttonsRange, filters, sorting,
                    availableParams: {
                        colors, materials, classifications
                    },
                    metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                    currentUrl: 'https://levount.com' + req.originalUrl,
                    socialImage: "https://assets.levount.com/images/og/og-image-001.jpg"
                }
            );
        } catch (error) {
            next(error);
        }
    },

    product: async (req, res, next) => {
        try {
            const { id } = req.params;
            const product = await productModel.getProducts({productSku: id, storeId: 0}); //console.log(`https://levount.com/images/products/${ product?.material }/${ product?.variants?.[0]?.category }/${ product?.sku?.toLowerCase() }/${ product?.sku?.toLowerCase() }-large.webp`);

            if (product?.active == 0 || !product) { return next(new appError("This product is not still available.", 404)); }

            res.render('pages/webstore/product',
                {
                    title: `Le Vount Jewelry | ${utils.capitalizeFirstLetter(product?.variants?.[0]?.category)} | ${id?.toUpperCase()}`,
                    page: 'product',
                    userSession: res.locals.userSession,
                    utils,
                    product,
                    metaDescription: utils.capitalizeFirstLetter(product?.variants?.[0]?.description),
                    currentUrl: 'https://levount.com' + req.originalUrl,
                    socialImage: `https://assets.levount.com/global/images/products/${ product?.material }/${ product?.variants?.[0]?.category }/${ product?.sku?.toLowerCase() }/${ product?.sku?.toLowerCase() }-large.webp`
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
                    socialImage: "https://assets.levount.com/images/og/og-image-001.jpg",
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
                    socialImage: "https://assets.levount.com/images/og/og-image-001.jpg",
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
                    socialImage: "https://assets.levount.com/images/og/og-image-001.jpg",
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
                const orderData = await orderModel.getOrder(orderId);
                
                if (!orderData) {
                    return res.redirect("/");
                } else {
                    res.clearCookie('cartSession');
                    res.render('pages/webstore/thanks' , {
                        title: `Le Vount Jewelry | Thanks`, 
                        userSession: res?.locals?.userSession, 
                        utils,
                        metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                        currentUrl: req?.protocol + '://' + req?.get('host') + req?.originalUrl,
                        socialImage: "https://assets.levount.com/images/og/og-image-001.jpg",
                        page: 'thanks',
                        orderData
                    });
                }                
            } else {
                return res.redirect("/");
            }

        } catch (error) {
            //console.log(error);
            next(error);
        }
    },

    signup: async(req, res, next) => {
        try {
            res.render('pages/webstore/signup',
                {
                    title: `Le Vount Jewelry | Sign Up`, 
                    userSession: res.locals.userSession, 
                    utils,
                    metaDescription: `Discover Le Vount. Handcrafted 18k gold jewelry designed for the modern muse. Shop rings, necklaces, and bracelets. Free shipping to the US.`,
                    currentUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
                    socialImage: "https://assets.levount.com/images/og/og-image-001.jpg",
                    page: 'terms'
                }
            );
        } catch (error) {
            next(error);
        }
    },

};

export default pageController;