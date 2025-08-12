const Mensaje = require('../models/mensaje');
const Usuario = require('../models/usuario');
const { response } = require('express');

/**
 * Obtener mensajes entre dos usuarios
 */
const obtenerMensajesEntreUsuarios = async (req, res = response) => {
    try {
        const { usuario1, usuario2, limite = 50, offset = 0 } = req.query;
        const { id } = req.user; // Cambiar de uid a id

        console.log('🔍 DEBUG - IDs de usuarios:');
        console.log('   - Usuario autenticado (id):', id);
        console.log('   - Usuario1:', usuario1);
        console.log('   - Usuario2:', usuario2);

        // Verificar que el usuario autenticado sea uno de los participantes
        if (id !== usuario1 && id !== usuario2) {
            console.log('❌ Usuario no autorizado para ver estos mensajes');
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para ver estos mensajes'
            });
        }

        console.log('✅ Usuario autorizado para ver mensajes');
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
        const { id } = req.user; // Cambiar de uid a id

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
            emisor: id, // Cambiar de uid a id
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
        const { id } = req.user; // Cambiar de uid a id

        const mensaje = await Mensaje.findById(mensajeId);
        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el receptor del mensaje
        if (mensaje.receptor.toString() !== id) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para marcar este mensaje como leído'
            });
        }

        mensaje.leido = true;
        mensaje.fechaLeido = new Date();
        await mensaje.save();

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
        const { id } = req.user; // Cambiar de uid a id

        const mensaje = await Mensaje.findById(mensajeId);
        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el receptor del mensaje
        if (mensaje.receptor.toString() !== id) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para marcar este mensaje como entregado'
            });
        }

        mensaje.entregado = true;
        mensaje.fechaEntregado = new Date();
        await mensaje.save();

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
 * Obtener mensajes no leídos del usuario autenticado
 */
const obtenerMensajesNoLeidos = async (req, res = response) => {
    try {
        const { id } = req.user; // Cambiar de uid a id

        const mensajes = await Mensaje.find({
            receptor: id,
            leido: false
        }).populate('emisor', 'nombre email online');

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
 * Buscar mensajes por contenido
 */
const buscarMensajes = async (req, res = response) => {
    try {
        const { query, usuario1, usuario2, limite = 20 } = req.query;
        const { id } = req.user; // Cambiar de uid a id

        // Verificar que el usuario autenticado sea uno de los participantes
        if (id !== usuario1 && id !== usuario2) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para buscar en estos mensajes'
            });
        }

        const mensajes = await Mensaje.find({
            $and: [
                {
                    $or: [
                        { emisor: usuario1, receptor: usuario2 },
                        { emisor: usuario2, receptor: usuario1 }
                    ]
                },
                {
                    contenido: { $regex: query, $options: 'i' }
                }
            ]
        })
            .populate('emisor', 'nombre email online')
            .populate('receptor', 'nombre email online')
            .limit(parseInt(limite))
            .sort({ createdAt: -1 });

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

/**
 * Obtener último mensaje entre dos usuarios
 */
const obtenerUltimoMensaje = async (req, res = response) => {
    try {
        const { usuario1, usuario2 } = req.query;
        const { id } = req.user; // Cambiar de uid a id

        // Verificar que el usuario autenticado sea uno de los participantes
        if (id !== usuario1 && id !== usuario2) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para ver este mensaje'
            });
        }

        const mensaje = await Mensaje.findOne({
            $or: [
                { emisor: usuario1, receptor: usuario2 },
                { emisor: usuario2, receptor: usuario1 }
            ]
        })
            .populate('emisor', 'nombre email online')
            .populate('receptor', 'nombre email online')
            .sort({ createdAt: -1 });

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
 * Eliminar mensaje
 */
const eliminarMensaje = async (req, res = response) => {
    try {
        const { mensajeId } = req.params;
        const { id } = req.user; // Cambiar de uid a id

        const mensaje = await Mensaje.findById(mensajeId);
        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el emisor del mensaje
        if (mensaje.emisor.toString() !== id) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para eliminar este mensaje'
            });
        }

        await Mensaje.findByIdAndDelete(mensajeId);

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
        const { id } = req.user; // Cambiar de uid a id

        const mensaje = await Mensaje.findById(mensajeId);
        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el receptor del mensaje
        if (mensaje.receptor.toString() !== id) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para reaccionar a este mensaje'
            });
        }

        // Agregar o actualizar reacción
        mensaje.reacciones = mensaje.reacciones || {};
        mensaje.reacciones[id] = tipo;
        await mensaje.save();

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
        const { id } = req.user; // Cambiar de uid a id

        const mensaje = await Mensaje.findById(mensajeId);
        if (!mensaje) {
            return res.status(404).json({
                ok: false,
                msg: 'Mensaje no encontrado'
            });
        }

        // Verificar que el usuario autenticado es el receptor del mensaje
        if (mensaje.receptor.toString() !== id) {
            return res.status(403).json({
                ok: false,
                msg: 'No tienes permisos para remover la reacción de este mensaje'
            });
        }

        // Remover reacción
        if (mensaje.reacciones && mensaje.reacciones[id]) {
            delete mensaje.reacciones[id];
            await mensaje.save();
        }

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

module.exports = {
    obtenerMensajesEntreUsuarios,
    enviarMensaje,
    marcarComoLeido,
    marcarComoEntregado,
    obtenerMensajesNoLeidos,
    buscarMensajes,
    obtenerUltimoMensaje,
    eliminarMensaje,
    agregarReaccion,
    removerReaccion
}; 