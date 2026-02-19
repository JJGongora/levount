import db from '../config/db.js';
import userModel from './userModel.js';
import authHelpers from "../utils/authHelpers.js";
import appError from '../utils/appError.js';
import bcrypt from 'bcryptjs';

const authModel = {
    authenticateUser: async (usernameInput, plainPassword) => {
        try {

            const users = await userModel.getUserLoginData(usernameInput); //console.log(users);

            if (users.length == 0) return null;

            const user = users;
            const passwordMatch = await authHelpers.comparePasswords(plainPassword, user.password);
            if (!passwordMatch) return null;

            const queryPermissions = `
                SELECT 
                    GROUP_CONCAT(DISTINCT r.name) as roleNames,
                    GROUP_CONCAT(DISTINCT p.slug) as permissionSlugs
                FROM userRoles ur
                    JOIN roles r ON ur.roleId = r.id
                    JOIN rolePermissions rp ON r.id = rp.roleId
                    JOIN permissions p ON rp.permissionId = p.id
                WHERE ur.userId = ?
            `;
            const [permData] = await db.query(queryPermissions, [user.id]);

            // Acceso a tiendas (para puntos de venta).
            const extraStoresQuery = `
                SELECT s.storeId
                FROM userStores s
                WHERE s.userId = ?
            `;
            const [extraStores] = await db.query(extraStoresQuery, [user.id]);
            const allowedStoresIds = extraStores.map(store => store.storeId);
            if (user.storeId) {
                allowedStoresIds.push(user.storeId);
            }
            const [storeData] = await db.query(extraStoresQuery, [user.id]);
            user.stores = storeData.map(store => store.storeId);

            let isGlobal = false;
            if (user.accessLevel >= 10) {
                isGlobal = true;
            }

            return {
                id: user.id,
                username: user.username,
                accessLevel: user.accessLevel,
                roles: permData[0].roleNames ? permData[0].roleNames.split(',') : [],
                permissions: permData[0].permissionSlugs ? permData[0].permissionSlugs.split(',') : [],
                allowedStores: [...new Set(allowedStoresIds)],
                isGlobal: isGlobal,
                name: user.displayName,
                currentStoreId: user.storeId,
                currentStoreName: user?.storeName || 'Sin tienda asignada',
                sessionVersion: user.sessionVersion
            };

        } catch (error) {
            throw error;
        }
    },

    signup: async(data, user) => {
        const conn = await db.getConnection();
        try {
            let { 
                name, lastname, phone, address, gender, birthDate, rfc, nss, displayName,
                username, email, password
            } = data;
            username = username || email;

            if (!name || !password || !lastname || !email) {
                throw new appError('Por favor, ingrese los campos obligatorios.', 400);
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await conn.beginTransaction();

                const personInsertQuery = `
                    INSERT INTO persons
                        (name, lastname, phone, address, gender, birthDate, rfc, nss, displayName)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                `;
                const personInsertValues = [
                    name, lastname, phone, address, gender, birthDate, rfc, nss, displayName || `${name} ${lastname}`
                ];
                const [personResult] = await conn.query(personInsertQuery, personInsertValues);
                const personId = personResult?.insertId;
                
                const userInsertQuery = `
                    INSERT INTO users (username, email, password, active, createdAt, createdBy, phone)
                    VALUES (?, ?, ?, ?, NOW(), ?, ?)
                `;
                const [userResult] = await conn.query(userInsertQuery, [username, email, hashedPassword, 1, user || 'System', phone]);
                const userId = userResult.insertId;

                let roleId = 2; // Vendedor por defecto.
                if (role === 'admin') roleId = 1;
                if (role === 'manager') roleId = 3;

                const userRoleInsertQuery = `
                    INSERT INTO userRoles (userId, roleId)
                    VALUES (?, ?)
                `;
                await conn.query(userRoleInsertQuery, [userId, roleId]);

            await conn.commit();

            return {
                success: true,
                message: 'Usuario creado correctamente',
                userId: userId
            };
        } catch (error) {
            await conn.rollback();
            
            if (error.code == 'ER_DUP_ENTRY') {
                throw new appError('El usuario o correo ya están registrados.', 400);
            }

            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    userVersion: async(username) => {
        const user = await userModel.getUserLoginData(username); //console.log(user);

        const queryPermissions = `
            SELECT 
                GROUP_CONCAT(DISTINCT r.name) as roleNames,
                GROUP_CONCAT(DISTINCT p.slug) as permissionSlugs
            FROM userRoles ur
                JOIN roles r ON ur.roleId = r.id
                JOIN rolePermissions rp ON r.id = rp.roleId
                JOIN permissions p ON rp.permissionId = p.id
            WHERE ur.userId = ?
        `;
        const [permData] = await db.query(queryPermissions, [user.id]);

        // Acceso a tiendas (para puntos de venta).
        const extraStoresQuery = `
            SELECT s.storeId
            FROM userStores s
            WHERE s.userId = ?
        `;
        const [extraStores] = await db.query(extraStoresQuery, [user.id]);
        const allowedStoresIds = extraStores.map(store => store.storeId);
        if (user.storeId) {
            allowedStoresIds.push(user.storeId);
        }
        const [storeData] = await db.query(extraStoresQuery, [user.id]);
        user.stores = storeData.map(store => store.storeId);

        let isGlobal = false;
        if (user.accessLevel >= 10) {
            isGlobal = true;
        }

        return {
            id: user.id,
            username: user.username,
            accessLevel: user.accessLevel,
            roles: permData[0].roleNames ? permData[0].roleNames.split(',') : [],
            permissions: permData[0].permissionSlugs ? permData[0].permissionSlugs.split(',') : [],
            allowedStores: [...new Set(allowedStoresIds)],
            isGlobal: isGlobal,
            name: user.displayName,
            currentStoreId: user.storeId,
            currentStoreName: user?.storeName || 'Sin tienda asignada',
            sessionVersion: user.sessionVersion,
            active: user.active,
            passwordReset: user.passwordReset
        };
    }
};

export default authModel;