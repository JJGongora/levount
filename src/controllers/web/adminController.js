import clientModel from "../../models/clientModel.js";
import { methods as utils } from "../../../public/js/utils.js";
import storesModel from "../../models/storesModel.js";
import countries from "country-list";

const Today = new Date();
const pageTitle = `Le Vount Admin System`;

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
            try {
                return res.render('pages/admin/new-product', {
                    title: `${ pageTitle } | Nuevo producto`,
                    page: 'new-product',
                    utils, Today
                });
            } catch (error) {
                next(error);
            }
        }
    }

};

export default adminController;