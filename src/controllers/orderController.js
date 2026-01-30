import appError from "../utils/appError.js";
import orderModel from "../models/orderModel.js";

const orderController = {

    get: async (req, res, next) => {
        try {  
            const { id } = req?.params;
            const orderData = await orderModel.getOrder(id);
            
            if(req.accepts('html')) {
                return res.status(500);
            } else {
                return res.status(200).send({success: true, order: orderData});
            }

        } catch (error) {
            next(error);
        }
    },

};

export default orderController;