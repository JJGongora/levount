import jwt from 'jsonwebtoken';
import appError from '../utils/appError.js';

const notLogged = (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (token) {
            return res.redirect('/');
        } else {
            return next();
        }
    } catch (error) {
        next(error);
    }
};

export default notLogged;