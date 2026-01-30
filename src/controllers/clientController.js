import clientModel from "../models/clientModel.js";
import storesModel from "../models/storesModel.js";
import filterHelper from "../utils/filterHelper.js";
import countries from "country-list";

const Today = new Date();
const pageTitle = process?.env?.FRONT_TITLE || "New project";
import { methods as utils } from "../../public/js/utils.js";

const clientController = {    

    getCreate: async(req, res, next) => {
        try {
            const branches = await storesModel.getAll();
            return res.render('pages/new-client', {
                title: `${ pageTitle } | Nuevo cliente`,
                page: 'new-client',
                utils, Today, branches, countries: countries.getData()
            });
        } catch (error) {
            next(error);
        }
    },

    // ====== MÉTODOS
    post: async(req, res, next) => {
    
        try {
            //console.log(req.body);
            const data = filterHelper.cleanEmptyFields(req.body, ['saleItems']); //console.log(" \n\n====== ", data, "\n== Sale Items ", data.sale.saleItems, "\n== Payments ", data.sale.payment);
            const containsGold = Object.values(data?.sale?.saleItems || {}).some(item => item.material == 'gold'); //data?.sale?.saleItems?
            if (data?.sale) {data.sale.containsGold = containsGold; }

            //console.log("\n\n\n\n", data, "\n\n\n\n", data?.sale);

            const result = await clientModel.register(data, res.locals.userSession.name);
            return res.status(200).send(result);
            //return res.status(400).send({success: false, message: "Esta es una prueba."});
        } catch (error) {
            next(error);
        }
        
    },
};

export default clientController;