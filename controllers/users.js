const Usuario = require('../models/usuario');

/**
 * Obtiene todos los usuarios registrados
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
    try {
        console.log('📊 Obteniendo todos los usuarios...');

        const usuarios = await Usuario.find({}, 'name email online lastLogin')
            .sort({ name: 1 });

        console.log(`✅ ${usuarios.length} usuarios encontrados`);

        res.json({
            ok: true,
            users: usuarios,
            total: usuarios.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Obtiene solo los usuarios online
 * GET /api/users/online
 */
const getOnlineUsers = async (req, res) => {
    try {
        console.log('🟢 Obteniendo usuarios online...');

        const usuariosOnline = await Usuario.find({ online: true }, 'name email online lastLogin')
            .sort({ name: 1 });

        console.log(`✅ ${usuariosOnline.length} usuarios online encontrados`);

        res.json({
            ok: true,
            users: usuariosOnline,
            total: usuariosOnline.length
        });
    } catch (error) {
        console.error('❌ Error obteniendo usuarios online:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Obtiene un usuario específico por ID
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`👤 Obteniendo usuario con ID: ${id}`);

        const usuario = await Usuario.findById(id, 'name email online lastLogin');

        if (!usuario) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado'
            });
        }

        console.log(`✅ Usuario encontrado: ${usuario.name}`);

        res.json({
            ok: true,
            user: usuario
        });
    } catch (error) {
        console.error('❌ Error obteniendo usuario:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Obtiene estadísticas de usuarios
 * GET /api/users/stats
 */
const getUsersStats = async (req, res) => {
    try {
        console.log('📈 Obteniendo estadísticas de usuarios...');

        const totalUsers = await Usuario.countDocuments();
        const onlineUsers = await Usuario.countDocuments({ online: true });
        const offlineUsers = totalUsers - onlineUsers;

        console.log(`📊 Stats: ${totalUsers} total, ${onlineUsers} online, ${offlineUsers} offline`);

        res.json({
            ok: true,
            stats: {
                total: totalUsers,
                online: onlineUsers,
                offline: offlineUsers
            }
        });
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getAllUsers,
    getOnlineUsers,
    getUserById,
    getUsersStats
};
