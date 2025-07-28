const { Router } = require('express');
const {
    getAllUsers,
    getOnlineUsers,
    getUserById,
    getUsersStats
} = require('../controllers/users');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// Aplicar middleware de autenticación JWT a todas las rutas
router.use(validarJWT);

// Obtener todos los usuarios
router.get('/', getAllUsers);

// Obtener usuarios online
router.get('/online', getOnlineUsers);

// Obtener un usuario específico por ID
router.get('/:id', getUserById);

// Obtener estadísticas de usuarios
router.get('/stats', getUsersStats);

module.exports = router;
