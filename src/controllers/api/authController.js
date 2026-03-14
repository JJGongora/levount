import authModel from "../../models/authModel.js";
import userModel from "../../models/userModel.js";
import jwt from "jsonwebtoken"; 

const authController = {    

    getLogin: async (req, res, next) => {
        try {
            res.render('pages/login', {
                title: 'Le Vount Core | Iniciar sesión',
                page: 'login',
                layout: 'layouts/error'
            });
        } catch (error) {
            next(error);
        }
    },

    logout: (req, res) => {
        res.clearCookie('jwt');
        res.clearCookie('username');
        res.redirect('/auth/login');
    },

    getSignup: async (req, res, next) => {
        try {
            res.render('pages/signup', {
                title: 'Le Vount Core | Registrar nuevo usuario',
                page: 'signup'
            });
        } catch (error) {
            next(error);
        }
    },

};

export default authController;