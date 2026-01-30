import dotenv from "dotenv";
dotenv.config();
import app from "./src/server.js";
import cron from "node-cron";
//import { testConnection } from "./src/config/db.js";

const PORT = process?.env?.PORT || 3000;
const projectName = process?.env?.PROJECT || "Proyecto";

async function startSystem() {
    try {
        //await testConnection();

        // ==========================
        // Cron jobs
        // ==========================
        // cron.schedule("*/15 * * * *", ejecutarTarea);

        app.listen(PORT, () => { console.log(`${projectName} running at ${PORT} port.`) });
    } catch (error) {
        console.error(`Error fatal al iniciar ${projectName}:`, error);
    }
}

startSystem().catch(err => {
    console.error("Error al iniciar el sistema:", err);
    process.exit(1);
});