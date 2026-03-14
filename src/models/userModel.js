import db from "../config/db.js";

const userModel = {

    getUserSessionData: async (userId) => {
        const query = `
            SELECT 
                GROUP_CONCAT(DISTINCT r.name) as roleNames,
                GROUP_CONCAT(DISTINCT p.slug) as permissionSlugs
            FROM userRoles ur
                JOIN roles r ON ur.roleId = r.id
                JOIN role_permissions rp ON r.id = rp.roleId
                JOIN permissions p ON rp.permissionId = p.id
            WHERE ur.userId = ?
        `;
        const [rows] = await db.query(query, [user.id]);
    },

    getUserLoginData: async(username) => {
        const query = `
            SELECT 
                u.*,
                s.name as storeName,
                p.name as firstName,
                p.lastName as lastName,
                p.gender,
                p.displayName
            FROM 
                users u
                LEFT JOIN stores s ON u.storeId = s.id
                LEFT JOIN persons p ON u.personId = p.id
            WHERE 
                (u.username = ? OR u.email = ?) 
                AND u.active = 1
        `;
        const result = await db.query(query, [username, username]);
        return result[0][0];
    },

    logIn: async(id) => {
        let query = `UPDATE users SET lastLogin = NOW() WHERE id = ?`;
        const result = await db.query(query, [id]);
        return result.affectedRows;
    },

    getAll: async(filters) =>{
        const limit = filters?.limit ? parseInt(filters?.limit) : 30;
        const page = filters?.page ? parseInt(filters?.page) : 1;
        const offset = (page - 1) * limit;

        let conditions = []; let params = [];
        let sort = "";

        const query = `
            SELECT 
                u.id, u.username, u.email, u.active, u.passwordReset,
                p.displayName, u.lastLogin, r.name as role
            FROM users u
            LEFT JOIN
                persons p
                    ON p.id = u.personId
            LEFT JOIN
                userRoles ur
                    ON ur.userId = u.id
            LEFT JOIN
                roles r
                    ON r.id = ur.roleId;
        `;
        const [result] = await db.query(query);
        return result;        
    },

}

export default userModel;