import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    
    // Opciones de Resiliencia
    waitForConnections: true, // Si todas las conexiones están ocupadas, esperar.
    connectionLimit: 10,      // Máximo 10 conexiones simultáneas.
    queueLimit: 0,            // Cola infinita de peticiones.
    timezone: 'Z'
});

export async function testConnection() {
    try {
        const connection = await pool.getConnection();
        connection.release();
        return true;
    } catch (error) {
        throw error;
    }
}

export default pool;