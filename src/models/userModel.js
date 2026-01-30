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
        const result = await db.query(query, id);
        return result.affectedRows;
    },

}

export default userModel;