import documentModel from "../models/documentModel.js";
import filterHelper from "../utils/filterHelper.js";

const documentController = {

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

                if (req.accepts('html')) {

                } else {                    
                    return res.status(200).send({
                        success: true,
                        message: "El documento ya se encuentra registrado. Si no es necesario actualizarlo, mantenga los datos que se muestran en este formulario.",
                        data: document
                    });
                }
            } catch(error) {
                return next(error);
            }

        }
    }

};

export default documentController;