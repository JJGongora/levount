import appError from "../../utils/appError.js";
import cartModel from "../../models/cartModel.js";
import authModel from "../../models/authModel.js";
import jwt from "jsonwebtoken";
import redisClient from "../../utils/redisClient.js";
import filterHelper from "../../utils/filterHelper.js";
import documentModel from "../../models/documentModel.js";
import clientModel from "../../models/clientModel.js";
import createPayPalClient from "../../config/paypalConfig.js";
import { ConsoleLogger, OrdersController } from '@paypal/paypal-server-sdk';
import paymentModel from "../../models/paymentModel.js";
import authHelpers from "../../utils/authHelpers.js";
import newsletterModel from "../../models/newsletterModel.js";
import sharp from "sharp";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from 'url';
import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";

// Variables globales
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiController = {

    // ===================================
    //        PASARELAS DE PAGOS
    // ===================================
    getPayPalClient: async(req, res, next) => {

        try {
            const { environment } = req.query;
            const ppClientId = (environment == 'sandbox')
                ? process.env.PP_CLIENT_SAND
                : process.env.PP_CLIENT_LIVE;
            return res.status(200).send({ppClientId: ppClientId});
        } catch (error) {
            next(error);
        }

    },
    paypal_create: async(req, res, next) => {
        try {

            //console.log(req.body);
            const { cartId, ppClient } = req.body; //console.log(cartId, ppClient);
            
            let clientId = ""; let clientSecret = ""; let isProduction;
            if (ppClient == process.env.PP_CLIENT_SAND) {
                clientId = process.env.PP_CLIENT_SAND; clientSecret = process.env.PP_SECRET_SAND; isProduction = false;
            } else if(ppClient == process.env.PP_CLIENT_LIVE) {
                clientId = process.env.PP_CLIENT_LIVE; clientSecret = process.env.PP_SECRET_LIVE; isProduction = true;
            } else {
                next(appError("Credenciales inválidas, no es posible crear la orden de PayPal.", 400));
            }

            const client = createPayPalClient(clientId, clientSecret, isProduction);
            const ordersController = new OrdersController(client);

            let calculatedItemTotal = 0; // Total de los items del carrito.
            const cartItems = await cartModel.getCartItems(cartId);
            const ppItems = cartItems?.items?.map(item => {
                const unitPrice = parseFloat(item.finalUnitPrice); //console.log(unitPrice);
                const qty = parseInt(item.quantity);
                calculatedItemTotal += unitPrice * qty;
                return {
                    name: item.name.length > 126 ? item.name.substring(0, 123) + "..." : item.name,
                    sku: item.sku?.toLowerCase(),
                    quantity: qty.toString(),                    
                    unitAmount: {
                        currencyCode: 'USD',
                        value: unitPrice.toFixed(2)
                    },                    
                    category: 'PHYSICAL_GOODS'
                };
            });
            const strItemTotal = calculatedItemTotal.toFixed(2); // Total de los items del carrito transformado a String.
            const shippingCost = 0; // Costo de envío.
            const strShipping = shippingCost.toFixed(2); // Costo de envío transformado a String.
            const grandTotal = (calculatedItemTotal + shippingCost).toFixed(2); // Total de la compra transformado a String.

            const body = {
                intent: 'CAPTURE',
                applicationContext: {
                    brandName: "Le Vount Jewelry",
                    shippingPreference: "NO_SHIPPING" ,                    
                    landingPage: "NO_PREFERENCE",
                },
                purchaseUnits: [{    
                    referenceId: cartId,
                    description: 'Le Vount Jewelry Purchase',
                    items: ppItems,
                    amount: {
                        currencyCode: 'USD',
                        value: grandTotal,
                        breakdown: {
                            itemTotal: {
                                currencyCode: "USD",
                                value: strItemTotal
                            },
                            shipping: {
                                currencyCode: 'USD',
                                value: strShipping
                            }
                        }
                    }
                }]
            };

            const { result } = await ordersController.createOrder({ body }); //console.log(result);
            return res.status(200).send({ success: true, id: result.id });
        } catch (error) {
            next(new appError(`<b>PayPal Error</b>: ${error?.result?.message}`, error?.statusCode));
        }
    },
    paypal_capture: async(req, res, next) => {
        try {
            
            const { orderId, ppClient, cartId } = req.body;

            let clientId = ""; let clientSecret = ""; let isProduction;
            if (ppClient == process.env.PP_CLIENT_SAND) {
                clientId = process.env.PP_CLIENT_SAND; clientSecret = process.env.PP_SECRET_SAND; isProduction = false;
            } else if(ppClient == process.env.PP_CLIENT_LIVE) {
                clientId = process.env.PP_CLIENT_LIVE; clientSecret = process.env.PP_SECRET_LIVE; isProduction = true;
            } else {
                next(appError("Wrong credentials, impossible to create PayPal Capture Order.", 400));
            }

            const client = createPayPalClient(clientId, clientSecret, isProduction);
            const ordersController = new OrdersController(client);
            const { result: paypalOrder } = await ordersController.getOrder({ id: orderId });        
            const authorizedAmount = parseFloat(paypalOrder.purchaseUnits[0].amount.value); 

            const cartItems = await cartModel.getCartItems(cartId); //console.log("\n\n\n", cartItems?.subtotal, authorizedAmount);
            const cleanPayload = await filterHelper.cleanEmptyFields(req?.body);
            
            if (Math.abs(authorizedAmount - cartItems?.subtotal) > 0.01) {
                next(new appError("<b>PayPal Error</b>. Wrong ammount. Your cart has changed. Please, refresh this page to pay the correct amount."));
            } else {

                const { result } = await ordersController.captureOrder({
                    id: orderId,
                    prefer: 'return=representation'
                }); //console.log(result);

                if (result.status == 'COMPLETED') {
                    const cleanPayPalResult = await filterHelper.cleanEmptyFields(result);
                    const purchaseRegister = await paymentModel.registerPayPalPurchase(cleanPayPalResult, cleanPayload, cartItems);
                    return res.status(200).send(purchaseRegister);
                } else {
                    return next(new appError("Your purchase cannot accomplished. Please, contact Support.", 400));
                }

            }     
            
        } catch (error) {
            next(new appError(error, 400));
        }
    },

    // ===================================
    //              CARRITO
    // ===================================
    get: async(req, res, next) => {
        try {
            const sessionId = res?.locals?.cartSession || req?.query?.cartSession;
            const cartItems = await cartModel.getCartItems(sessionId); //console.log(cartItems);
            return res.status(200).send(cartItems);
        } catch (error) {
            next(error);
        }
    },
    add: async(req, res, next) => {
        try {
            
            if (!req.body) { next(new appError("Please, provide a valid SKU to add to your cart.", 400)); };
            const { productSku } = req?.body; if (!productSku) { next(new appError("Please, provide a valid SKU to add to your cart.", 400)); };
            const { quantity } = req?.params; //console.log(req.headers);
            const sessionId = res?.locals?.cartSession || req?.body?.cartSession; if(!sessionId) { next(new appError("Please, provide a valid cart session Id.", 400)); }
            
            const storeId = 0;

            const existingCarts = await cartModel.getCartSession(sessionId);
            let cartId = (existingCarts.length == 0) ? await cartModel.createCart(sessionId, storeId) : existingCarts?.[0]?.id;
            const insertItem = await cartModel.addToCart(cartId, productSku, quantity);
            return res.status(200).send(insertItem);
        } catch (error) {
            next(error);
        }
    },
    delete: async(req, res, next) => {
        try {
            if (!req.body) { next(new appError("Please, provide a valid SKU to add to your cart.", 400)); };
            const { productSku } = req.body; if (!productSku) { next(new appError("Please, provide a valid SKU to add to your cart.", 400)); };
            const { quantity } = req?.params; //console.log(req.body);
            const sessionId = res?.locals?.cartSession || req?.body?.cartSession; if(!sessionId) { next(new appError("Please, provide a valid cart session Id.", 400)); }

            const existingCarts = await cartModel.getCartSession(sessionId);
            let cartId = (existingCarts.length == 0) ? await cartModel.createCart(sessionId) : existingCarts?.[0]?.id;
            const deleteItem = await cartModel.deleteFromCart(cartId, productSku, quantity);
            return res.status(200).send(deleteItem);
        } catch (error) {
            next(error);
        }
    },

    // ===================================
    //           AUTENTICACIÓN
    // ===================================
    login: async (req, res, next) => {
        try {
            // Si ya ha iniciado sesión, no permitir otro inicio de sesión.
            if (res?.locals?.userSession || req?.userSession) {
                return res.status(400).send({
                    success: false,
                    message: "An active session already exists."
                });
            }

            // Si no ha ingresado usuario o contraseña, devolver error.
            const { password, currentUrl, user } = req.body;
            const usernameInput = user ? user.toLowerCase() : null;
            if (!usernameInput || !password) {
                return res.status(400).send({
                    status: "Error",
                    message: "Please, enter your user and password."
                });
            }

            // Se verifican las credenciales del usuario y, de ser correctas, se devuelven los datos de la sesión.
            const userSession = await authModel.authenticateUser(usernameInput, password); //console.log("======= Sesión de usuario (authController.login):", userSession);    
            
            if (!userSession || userSession.success == false) {
                return res.status(401).send({
                    status: "Error",
                    message: "Wrong credentials. Please, verify your user and password."
                });
            } else {
                await userModel.logIn(userSession?.id);
            }

            // Se guardan los datos de la sesión en un JWT y se envía como cookie.
            const token = jwt.sign(
                { userSession },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRATION }
            );

            // Configuración de la cookie.
            const cookieOption = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRATION * 24 * 60 * 60 * 1000),
                path: "/",
                httpOnly: true,
            };

            // Se envía la cookie con el token JWT.
            res.cookie("jwt", token, cookieOption);            
            req.userSession = userSession;
            await redisClient.set(`session_v:${userSession.username}`, userSession.sessionVersion.toString(), {
                EX: 3600 
            });
            
            return res.status(200).send({
                success: true,
                redirect: currentUrl || '/'
            });

        } catch (error) {
            next(error);
        }
    },
    signUp: async (req, res, next) => {
        try {
            const username = res?.locals?.userSession?.id || null;
            //console.log(req.get('Referer'));
            const data = filterHelper.cleanEmptyFields(req.body);
            data.storeId = 0;
            const signUpResult = await authModel.signup(data);
            return res.status(201).send(signUpResult);
        } catch (error) {
            next(error);
        }
    },
    logout: async(req, res, next) => {
        try {
            res.clearCookie('jwt');
            res.clearCookie('cartSession');
            if (req.userSession?.username) {
                await redisClient.del(`session_v:${req.userSession.username}`);
            }
            return res.redirect('/');
        } catch (error) {
            next(error);
        }
    },

    sales: {
        get: async(req, res, next) => {

            try {
                const { documentType, documentNumber, storeId, docDate } = req.params;
                let data = { documentType: 'sale', documentNumber, storeId, docDate }; data = filterHelper.cleanEmptyFields(data); //console.log(data);
                const document = await documentModel.getAllData(data);  
                
                if (!document) {
                    return res.status(400).send({
                        success: 'warning',
                        message: "Este documento no está registrado. Se creará un nuevo registro con los datos insertados.",
                        data: document
                    });
                }                  
                return res.status(200).send({
                    success: true,
                    message: "El documento ya se encuentra registrado. Si no es necesario actualizarlo, mantenga los datos que se muestran en este formulario.",
                    data: document
                });
            } catch(error) {
                return next(error);
            }

        }
    },

    clients: {
        post: async(req, res, next) => {
    
            try {
                //console.log(req.body);
                const data = filterHelper.cleanEmptyFields(req.body, ['saleItems']); //console.log(" \n\n====== ", data, "\n== Sale Items ", data.sale.saleItems, "\n== Payments ", data.sale.payment);
                const containsGold = Object.values(data?.sale?.saleItems || {}).some(item => item.material == 'gold'); //data?.sale?.saleItems?
                if (data?.sale) {data.sale.containsGold = containsGold; }

                //console.log("\n\n\n\n", data, "\n\n\n\n", data?.sale?.payment);

                const result = await clientModel.register(data, res.locals.userSession.name, 0);
                return res.status(200).send(result);
                //return res.status(400).send({success: false, message: "Esta es una prueba."});
            } catch (error) {
                next(error);
            }
            
        },

        get: async(req, res, next) => {
            try {
                const result = await clientModel.getClients(filterHelper.cleanEmptyFields(req.query)); console.log(result);
                return res.status(200).send(result);
                //return res.status(400).send({success: false, message: "Esta es una prueba."});
            } catch (error) {
                next(error);
            }
        }
    },

    newsletter: {
        post: async (req, res, next) => {
            try {
                const data = filterHelper.cleanEmptyFields(req.body);
                if (!data.email) { return next(new appError("Please, enter a valid email address.", 400)); }
                if(!data.token) { return next(new appError("Verification error. Please, enable JavaScript and refresh.", 400)); } 

                const tokenVerify = await authHelpers.verifyCloudflareToken(data?.token, req?.ip);
                if (tokenVerify.success) {
                    const subscription = await newsletterModel.subscribe(data.email);
                    return res.status(200).send(subscription);
                } else {
                    return next(new appError("Security check failed, please refresh.", 400));
                }
            } catch (error) {
                next(error);
            }
        }
    },

    products: {
        create: async(req, res, next) => {
            try {                
                const data = filterHelper.cleanEmptyFields(req?.body); //console.log(req?.body);
                const productSku = data?.product?.sku?.toLowerCase();
                const files = req?.files;
                const username = res?.locals?.userSession?.name || req?.body?.username || 'System';

                if (!data?.product?.shape || !data?.product?.material || !data?.product?.sku) {
                    return next(new appError("Por favor, ingrese todos los datos obligatorios (*)."));
                } 
                
                const result = await productModel.create(data?.product, username);                

                // Se procesan las imágenes.
                if (result?.[0]?.status == "success" && files && files?.length > 0) {

                    const productFolder = path.join(__dirname, 
                        `../../../public/images/products/${data?.product?.material?.toLowerCase()}/${filterHelper.shapeToCategory.english(data?.product?.shape)}/${productSku?.toLowerCase()}`
                    ); console.log(productFolder);
                    await fs.ensureDir(productFolder); // Se verifica que el directorio exista.

                    // Se procesa cada imagen subida.
                    const imageProcessingPromises = files?.map(async (file, index) => {
                        const timestamp = Date.now();
                        const baseName = (index == 0)
                            ? `${productSku?.toLowerCase()}`
                            : `${productSku?.toLowerCase()}-${index}`;

                        const sizes = [
                            { suffix: 'thumb', width: 500, quality: 60 },
                            { suffix: 'medium', width: 1000, quality: 85 },
                            { suffix: 'large', width: 1500, quality: 85 }
                        ];

                        await Promise.all(sizes.map(size => {
                            return sharp(file.buffer)
                                .resize({ width: size.width })
                                .toFormat('webp')
                                .webp({ quality: size.quality })
                                .toFile(path.join(productFolder, `${baseName}-${size.suffix}.webp`));
                        }));
                    });
                }

                res.status(200).send(result);
            } catch (error) {
                console.log(error);
                next(error);
            }
        },

        update: async(req, res, next) => {
            try {
                //console.log(req.params);
                const data = filterHelper.cleanEmptyFields(req?.body);

            } catch (error) {
                next(error);
            }
        },

        images: {
            delete: async(req, res, next) => {

            },
        },

        get: async(req, res, next) => {
            try {
                const { search } = req?.query; //console.log(search);
                const products = await productModel.getProducts({search: search, storeId: 0, limit: 10});
                res.status(200).send(products);
            } catch (error) {
               next(error); 
            }
        }
    },

    user: {
        get: {
            userVersion: async(req, res, next) => {
                try {
                    const username = req?.query;
                    const result = await authModel.userVersion(username);
                    res.status(200).send(result);
                } catch (error) {
                    next(error);
                }
            },
        },

        post: {
            authenticateUser: async(req, res, next) => {
                try {
                    const { username, password } = req?.body; //console.log(username, password);
                    const result = await authModel.authenticateUser(username, password); //console.log(result);
                    res.status(200).send(result);
                } catch (error) {
                    next(error);
                }
            },
        }
    },

    admin: {
        signUp: async (req, res, next) => {
            try {
                const username = res?.locals?.userSession?.id || null;
                let data = filterHelper.cleanEmptyFields(req.body);
                data.isAdmin == true;
                const signUpResult = await authModel.signup(data, null, true);
                return res.status(201).send(signUpResult);
            } catch (error) {
                next(error);
            }
        },
    }

};

export default apiController;