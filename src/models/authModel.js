import db from '../config/db.js';
import userModel from './userModel.js';
import authHelpers from "../utils/authHelpers.js";
import appError from '../utils/appError.js';
import bcrypt from 'bcryptjs';
import emailTemplates from '../utils/emailTemplates.js';
import sendEmail from '../services/emailSending.js';
import emailModel from './emailModel.js';

const authModel = {
    authenticateUser: async (usernameInput, plainPassword) => {
        try {

            const users = await userModel.getUserLoginData(usernameInput); //console.log(users);

            if (!users || users?.length == 0) return {success: false, message: "Please, verify your credentials."};

            const user = users;
            const passwordMatch = await authHelpers.comparePasswords(plainPassword, user.password);
            if (!passwordMatch) return {success: false, message: "Please, verify your credentials."};

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

    signup: async(data, user, isAdmin) => {
        const conn = await db.getConnection();
        
        try {
            let { 
                name, lastname, phone, address, gender, birthDate, rfc, nss, displayName,
                username, email, password, storeId = 0, roleId = 0 // Por defecto, el usuario a crear será cliente.
            } = data; //console.log(data);
            username = username || email;

            password = (!password && isAdmin) ? Math.random().toString(36).slice(-8) : password;

            if (!name || !password || !lastname || !email) {
                return { success: false, message: "Please, provide all required fields.", errorType: "empty_fields" };
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await conn.beginTransaction();

                const personInsertQuery = `
                    INSERT INTO persons
                        (name, lastname, phone, address, gender, birthDate, rfc, nss, displayName)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                `;
                const personInsertValues = [
                    name, lastname, phone, address, gender, birthDate, rfc, nss, displayName || `${name?.split(' ')?.[0] || name} ${lastname?.split(' ')?.[0] || lastname}`
                ];
                const [personResult] = await conn.query(personInsertQuery, personInsertValues);
                const personId = personResult?.insertId; //console.log(personResult);
                
                const userInsertQuery = `
                    INSERT INTO users (username, email, password, active, createdAt, createdBy, personId, passwordReset)
                    VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
                `;
                const [userResult] = await conn.query(userInsertQuery, [username, email, hashedPassword, 1, user || 'System', personId, (isAdmin) ? true : null]);
                const userId = userResult.insertId;

                const userRoleInsertQuery = `
                    INSERT INTO userRoles (userId, roleId)
                    VALUES (?, ?)
                `;
                await conn.query(userRoleInsertQuery, [userId, roleId]);

            await conn.commit();

            // ============================================
            // Envío del correo electrónico de nueva cuenta.
            // ============================================

            const sender = (storeId == 0) ? `levount-noreply` : `silverbest-noreply`;
            const emailData = await authHelpers.senderEmailData(sender);
            const emailParams = {
                username: emailData.user,
                pass: emailData.pass,
                display: emailData.display,
                recipient: email,
                subject: (storeId == 0) ? `Your Le Vount's new user account is ready.` : `Tu nueva cuenta en Silver Best Price está lista.`,
                text: (storeId == 0) ? `Your Le Vount's new user account is ready.` : `Tu nueva cuenta en Silver Best Price está lista.`,
                attachments: null /*[
                    {
                        filename: `Logo_KCA-${ data?.Logo }.png`,
                        path: `/public/images/email/`,
                        cid: 'logo'
                    }
                ]*/,
                html: (isAdmin) 
                    ? emailTemplates.LeVount.newAdminAccount({ name: name, email: email, password: password, gender: gender })  
                    : (storeId == 0) 
                        ? emailTemplates.LeVount.newAccount(name, email) 
                        : emailTemplates.SilverBest.newAccount(name)
            };
            const sendingEmail = await sendEmail(emailParams);
            if (sendingEmail.success) { await emailModel.registerSend(email, emailData.user, username); }

            return {
                success: true,
                message: (isAdmin) ? 'Se ha creado el usuario exitosamente. Se han enviado instrucciones a la dirección ingresada.' : 'User created successfully. A confirmation email has sent to your address.',
                userId: userId
            };
        } catch (error) {
            await conn.rollback();
            
            if (error.code == 'ER_DUP_ENTRY') {
                return { success: false, message: "This user already exists.", errorType: "user_exists" };
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
    },

    getRoles: async() => {
        const query = `
            SELECT id, name FROM
                roles
        `;
        const [result] = await db.query(query);
        return result;
    }
};

export default authModel;