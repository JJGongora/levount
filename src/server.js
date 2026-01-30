import express from "express";
import path from "path";
import routes from "./routes/index.js";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import expressLayouts from "express-ejs-layouts";
import appError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errors/errorController.js";
import db from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pageTitle = process?.env?.FRONT_TITLE || "New project";
const developerAccessLevel = 10;

process.on('unhandledRejection', (reason, promise) => {
    // Manejo de errores de promesas rechazadas no controladas. 
    console.error("Rejected promise:", error); 
});
process.on('uncaughtException', (error) => {
    // Manejo de errores de excepciones no atrapadas.
    console.error("Uncaught exception:", error); 
});
process.on('SIGINT', async () => {
    console.log('🔴 Cerrando servidor y desconectando base de datos...');
    await db.end();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await db.end();
    process.exit(0);
});

const app = express();
app.set("views", path.join(__dirname, './views'));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());

app.use(expressLayouts);
app.set("layout extractScripts", true); //Envía a los scripts al final del body.
app.set("layout extractStyles", true);

app.use((req, res, next) => {
    if (req.session && req.session.userSession) {
        res.locals.userSession = req.session.userSession;
        
        res.locals.currentStoreName = req.session.userSession.currentStoreName;
        res.locals.currentStoreId = req.session.userSession.currentStoreId;
    } else {
        res.locals.userSession = null;
        res.locals.currentStoreName = '';
    }
    
    next();
});

app.use(cors({
    origin: [
        `127.0.0.1:${process.env.PORT}`,
        `https://levount.com`,
        `https://www.levount.com`,
        `http://192.168.1.11:5506`,
        `http://192.168.1.11:5507`,
        `http://192.168.1.11:5505`
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Headers permitidos
}));
app.use(routes);
app.all(/(.*)/, (req, res, next) => {
    next(new appError(`No se encontró ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);

export default app;