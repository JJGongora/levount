import appError from "../utils/appError.js";
import createPayPalClient from "../config/paypalConfig.js";
import { OrdersController } from '@paypal/paypal-server-sdk';
import productModel from "../models/productModel.js";
import cartModel from "../models/cartModel.js";
import paymentModel from "../models/paymentModel.js";
import filterHelper from "../utils/filterHelper.js";

const paymentController = {
    
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
                    sku: item.sku,
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

};

export default paymentController;