const { Router } = require('express');
const { validarJWT } = require('../middlewares/validar-jwt');
const {
    obtenerMensajesEntreUsuarios,
    enviarMensaje,
    marcarComoLeido,
    marcarComoEntregado,
    obtenerMensajesNoLeidos,
    eliminarMensaje,
    agregarReaccion,
    removerReaccion,
    obtenerUltimoMensaje,
    buscarMensajes
} = require('../controllers/mensajes');

const router = Router();

// Todas las rutas requieren autenticación
router.use(validarJWT);

// Obtener mensajes entre dos usuarios
router.get('/entre-usuarios', obtenerMensajesEntreUsuarios);

// Obtener último mensaje entre dos usuarios
router.get('/ultimo', obtenerUltimoMensaje);

// Obtener mensajes no leídos del usuario autenticado
router.get('/no-leidos', obtenerMensajesNoLeidos);

// Buscar mensajes por contenido
router.get('/buscar', buscarMensajes);

// Enviar un mensaje
router.post('/', enviarMensaje);

// Marcar mensaje como leído
router.put('/:mensajeId/leido', marcarComoLeido);

// Marcar mensaje como entregado
router.put('/:mensajeId/entregado', marcarComoEntregado);

// Agregar reacción a un mensaje
router.post('/:mensajeId/reaccion', agregarReaccion);

// Remover reacción de un mensaje
router.delete('/:mensajeId/reaccion', removerReaccion);

// Eliminar mensaje
router.delete('/:mensajeId', eliminarMensaje);

module.exports = router; 