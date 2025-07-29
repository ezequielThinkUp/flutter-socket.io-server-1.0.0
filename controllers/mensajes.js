const Mensaje = require('../models/mensaje');
const Usuario = require('../models/usuario');
const { response } = require('express');

/**
 * Obtener mensajes entre dos usuarios
 */
const obtenerMensajesEntreUsuarios = async (req, res = response) => {
    try {
        const { usuario1, usuario2, limite = 50, offset = 0 } = req.query;
        const { uid } = req.user;

        // Verificar que el usuario autenticado sea uno de los participantes
        if (uid !== usuario1 && uid !== usuario2) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para ver estos mensajes'
            });
        }

        const mensajes = await Mensaje.obtenerMensajesEntreUsuarios(
            usuario1,
            usuario2,
            parseInt(limite),
            parseInt(offset)
        );

        res.json({
            ok: true,
            mensajes: mensajes.reverse(), // Ordenar del más antiguo al más reciente
            total: mensajes.length
        });

    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Enviar un mensaje
 */
const enviarMensaje = async (req, res = response) => {
    try {
        const { receptor, contenido, tipo = 'texto', archivoUrl, duracion, metadatos } = req.body;
        const { uid } = req.user;

        // Validar que el receptor existe
        const usuarioReceptor = await Usuario.findById(receptor);
        if (!usuarioReceptor) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario receptor no encontrado'
            });
        }

        // Crear el mensaje
        const mensaje = new Mensaje({
            contenido,
            emisor: uid,
            receptor,
            tipo,
            archivoUrl,
            duracion,
            metadatos: metadatos || {}
        });

        await mensaje.save();

        // Poblar los datos del emisor y receptor
        await mensaje.populate('emisor', 'nombre email online');
        await mensaje.populate('receptor', 'nombre email online');

        res.json({
            ok: true,
            mensaje,
            msg: 'Mensaje enviado correctamente'
        });

    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Marcar mensaje como leído
 */
const marcarComoLeido = async (req, res = response) => {
    try {
        const { mensajeId } = req.params;
        const { uid } = req.user;

        const mensaje = await Mensaje.findById(mensajeId);

        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el receptor
        if (mensaje.receptor.toString() !== uid) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para marcar este mensaje como leído'
            });
        }

        await mensaje.marcarComoLeido();

        res.json({
            ok: true,
            mensaje,
            msg: 'Mensaje marcado como leído'
        });

    } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Marcar mensaje como entregado
 */
const marcarComoEntregado = async (req, res = response) => {
    try {
        const { mensajeId } = req.params;
        const { uid } = req.user;

        const mensaje = await Mensaje.findById(mensajeId);

        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el receptor
        if (mensaje.receptor.toString() !== uid) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para marcar este mensaje como entregado'
            });
        }

        await mensaje.marcarComoEntregado();

        res.json({
            ok: true,
            mensaje,
            msg: 'Mensaje marcado como entregado'
        });

    } catch (error) {
        console.error('Error marcando mensaje como entregado:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Obtener mensajes no leídos del usuario
 */
const obtenerMensajesNoLeidos = async (req, res = response) => {
    try {
        const { uid } = req.user;

        const mensajes = await Mensaje.obtenerMensajesNoLeidos(uid);

        res.json({
            ok: true,
            mensajes,
            total: mensajes.length
        });

    } catch (error) {
        console.error('Error obteniendo mensajes no leídos:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Eliminar mensaje
 */
const eliminarMensaje = async (req, res = response) => {
    try {
        const { mensajeId } = req.params;
        const { uid } = req.user;

        const mensaje = await Mensaje.findById(mensajeId);

        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el emisor
        if (mensaje.emisor.toString() !== uid) {
            return res.status(403).json({
                ok: false,
                msg: 'Solo puedes eliminar tus propios mensajes'
            });
        }

        await mensaje.eliminarMensaje(uid);

        res.json({
            ok: true,
            msg: 'Mensaje eliminado correctamente'
        });

    } catch (error) {
        console.error('Error eliminando mensaje:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Agregar reacción a un mensaje
 */
const agregarReaccion = async (req, res = response) => {
    try {
        const { mensajeId } = req.params;
        const { tipo } = req.body;
        const { uid } = req.user;

        const mensaje = await Mensaje.findById(mensajeId);

        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        await mensaje.agregarReaccion(uid, tipo);

        res.json({
            ok: true,
            mensaje,
            msg: 'Reacción agregada correctamente'
        });

    } catch (error) {
        console.error('Error agregando reacción:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Remover reacción de un mensaje
 */
const removerReaccion = async (req, res = response) => {
    try {
        const { mensajeId } = req.params;
        const { uid } = req.user;

        const mensaje = await Mensaje.findById(mensajeId);

        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        await mensaje.removerReaccion(uid);

        res.json({
            ok: true,
            mensaje,
            msg: 'Reacción removida correctamente'
        });

    } catch (error) {
        console.error('Error removiendo reacción:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Obtener último mensaje entre dos usuarios
 */
const obtenerUltimoMensaje = async (req, res = response) => {
    try {
        const { usuario1, usuario2 } = req.query;
        const { uid } = req.user;

        // Verificar que el usuario autenticado sea uno de los participantes
        if (uid !== usuario1 && uid !== usuario2) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para ver este mensaje'
            });
        }

        const mensaje = await Mensaje.obtenerUltimoMensaje(usuario1, usuario2);

        res.json({
            ok: true,
            mensaje
        });

    } catch (error) {
        console.error('Error obteniendo último mensaje:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

/**
 * Buscar mensajes por contenido
 */
const buscarMensajes = async (req, res = response) => {
    try {
        const { query, usuario1, usuario2, limite = 20 } = req.query;
        const { uid } = req.user;

        // Verificar que el usuario autenticado sea uno de los participantes
        if (uid !== usuario1 && uid !== usuario2) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para buscar en estos mensajes'
            });
        }

        const mensajes = await Mensaje.find({
            $or: [
                { emisor: usuario1, receptor: usuario2 },
                { emisor: usuario2, receptor: usuario1 }
            ],
            contenido: { $regex: query, $options: 'i' },
            eliminado: false
        })
            .sort({ timestamp: -1 })
            .limit(parseInt(limite))
            .populate('emisor', 'nombre email online')
            .populate('receptor', 'nombre email online');

        res.json({
            ok: true,
            mensajes,
            total: mensajes.length
        });

    } catch (error) {
        console.error('Error buscando mensajes:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

module.exports = {
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
}; 