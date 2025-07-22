// Gestión segura de usuarios conectados
const usuariosConectados = new Map();

module.exports = (io) => {

    console.log('🔌 Socket.io v4 configurado correctamente');

    // Evento de conexión principal (compatible con v4)
    io.on('connection', (socket) => {
        console.log(`✅ Cliente conectado: ${socket.id}`);

        // --- AUTENTICACIÓN DE USUARIO ---
        socket.on('login', (data) => {
            try {
                const { nombre, uid, email } = data;

                // Validar datos de entrada
                if (!nombre || !uid) {
                    socket.emit('login-error', { mensaje: 'Datos incompletos: nombre y uid requeridos' });
                    return;
                }

                // Verificar si el usuario ya está conectado
                const yaConectado = Array.from(usuariosConectados.values())
                    .find(user => user.uid === uid);

                if (yaConectado) {
                    socket.emit('login-error', { mensaje: 'Usuario ya conectado desde otro dispositivo' });
                    return;
                }

                // Almacenar usuario de forma segura
                usuariosConectados.set(socket.id, {
                    socketId: socket.id,
                    nombre: nombre.trim(),
                    uid: uid.trim(),
                    email: email?.trim() || '',
                    online: true,
                    ultimaConexion: Date.now()
                });

                console.log(`👤 Usuario autenticado: ${nombre} (${uid})`);

                // Confirmar login exitoso
                socket.emit('login-ok', {
                    usuario: usuariosConectados.get(socket.id),
                    usuariosOnline: Array.from(usuariosConectados.values())
                });

                // Notificar a otros usuarios
                socket.broadcast.emit('usuario-conectado', {
                    usuario: usuariosConectados.get(socket.id)
                });

            } catch (error) {
                console.error('❌ Error en login:', error.message);
                socket.emit('login-error', { mensaje: 'Error interno del servidor' });
            }
        });

        // --- MENSAJES DE CHAT (Compatibilidad con template original) ---
        socket.on('mensaje', (payload) => {
            try {
                const emisor = usuariosConectados.get(socket.id);

                if (!emisor) {
                    socket.emit('mensaje-error', { mensaje: 'Usuario no autenticado' });
                    return;
                }

                console.log('💬 Mensaje recibido:', payload);

                // Broadcast del mensaje a todos los clientes (modo original)
                io.emit('mensaje', {
                    usuario: emisor.nombre,
                    mensaje: payload,
                    timestamp: Date.now(),
                    uid: emisor.uid
                });

            } catch (error) {
                console.error('❌ Error enviando mensaje:', error.message);
                socket.emit('mensaje-error', { mensaje: 'Error al procesar mensaje' });
            }
        });

        // --- MENSAJES PRIVADOS (Para Flutter Chat App) ---
        socket.on('mensaje-personal', (payload) => {
            try {
                const { para, mensaje, tipo = 'texto' } = payload;
                const emisor = usuariosConectados.get(socket.id);

                if (!emisor) {
                    socket.emit('mensaje-error', { mensaje: 'Usuario no autenticado' });
                    return;
                }

                // Buscar socket del destinatario
                const destinatarioEntry = Array.from(usuariosConectados.entries())
                    .find(([socketId, user]) => user.uid === para);

                const mensajeCompleto = {
                    de: emisor.uid,
                    para,
                    mensaje: mensaje.trim(),
                    tipo,
                    timestamp: Date.now(),
                    nombreEmisor: emisor.nombre
                };

                if (destinatarioEntry) {
                    // Enviar al destinatario específico
                    const [destinatarioSocketId] = destinatarioEntry;
                    io.to(destinatarioSocketId).emit('mensaje-personal', mensajeCompleto);

                    // Confirmar entrega al emisor
                    socket.emit('mensaje-enviado', {
                        ...mensajeCompleto,
                        entregado: true
                    });

                    console.log(`💌 Mensaje privado: ${emisor.nombre} → ${destinatarioEntry[1].nombre}`);

                } else {
                    // Usuario no disponible
                    socket.emit('mensaje-enviado', {
                        ...mensajeCompleto,
                        entregado: false,
                        error: 'Usuario no disponible'
                    });

                    console.log(`📵 Usuario no disponible: ${para}`);
                }

            } catch (error) {
                console.error('❌ Error en mensaje privado:', error.message);
                socket.emit('mensaje-error', { mensaje: 'Error al enviar mensaje privado' });
            }
        });

        // --- INDICADOR DE ESCRITURA ---
        socket.on('escribiendo', (data) => {
            try {
                const { para, escribiendo } = data;
                const emisor = usuariosConectados.get(socket.id);

                if (!emisor) return;

                const destinatarioEntry = Array.from(usuariosConectados.entries())
                    .find(([socketId, user]) => user.uid === para);

                if (destinatarioEntry) {
                    const [destinatarioSocketId] = destinatarioEntry;
                    io.to(destinatarioSocketId).emit('escribiendo', {
                        de: emisor.uid,
                        nombre: emisor.nombre,
                        escribiendo: !!escribiendo
                    });
                }

            } catch (error) {
                console.error('❌ Error en indicador escribiendo:', error.message);
            }
        });

        // --- OBTENER USUARIOS ONLINE ---
        socket.on('obtener-usuarios', () => {
            const usuario = usuariosConectados.get(socket.id);
            if (!usuario) return;

            socket.emit('usuarios-online', {
                usuarios: Array.from(usuariosConectados.values()),
                total: usuariosConectados.size
            });
        });

        // --- DESCONEXIÓN ---
        socket.on('disconnect', (reason) => {
            const usuario = usuariosConectados.get(socket.id);

            if (usuario) {
                console.log(`❌ Usuario desconectado: ${usuario.nombre} (${reason})`);

                // Notificar desconexión a otros usuarios
                socket.broadcast.emit('usuario-desconectado', { usuario });

                // Eliminar usuario de la lista
                usuariosConectados.delete(socket.id);
            }

            console.log(`🔌 Socket desconectado: ${socket.id}`);
        });

        // --- MANEJO DE ERRORES ---
        socket.on('error', (error) => {
            console.error('🚨 Error en socket:', error.message);
        });

    });

    // Estadísticas del servidor cada 30 segundos
    setInterval(() => {
        console.log(`📊 Usuarios conectados: ${usuariosConectados.size}`);
    }, 30000);

    // Limpieza de usuarios inactivos cada 5 minutos
    setInterval(() => {
        const ahora = Date.now();
        const tiempoLimite = 5 * 60 * 1000; // 5 minutos

        for (const [socketId, usuario] of usuariosConectados) {
            if (ahora - usuario.ultimaConexion > tiempoLimite) {
                usuariosConectados.delete(socketId);
                console.log(`🧹 Usuario limpiado por inactividad: ${usuario.nombre}`);
            }
        }
    }, 5 * 60 * 1000);

};
