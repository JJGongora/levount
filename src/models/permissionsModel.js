import db from "../config/db.js";

const permissionsModel = {

    getRoleGroupPermissions: async (userId, permissionSlug) => {
        const query = `
            SELECT p.slug
            FROM user_roles ur
                JOIN role_permissions rp ON ur.role_id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
            WHERE 
                ur.user_id = ? 
                AND p.slug = ?
            LIMIT 1
        `;
        const [rows] = await db.query(query, [userId, permissionSlug]);
        return rows;
    },

}

export default permissionsModel;