const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
    // ID único del mensaje
    id: {
        type: String,
        required: true,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },

    // Contenido del mensaje
    contenido: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },

    // ID del usuario que envía el mensaje
    emisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    // ID del usuario que recibe el mensaje
    receptor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },

    // Tipo de mensaje
    tipo: {
        type: String,
        enum: ['texto', 'imagen', 'audio', 'video', 'archivo', 'ubicacion', 'contacto', 'sistema'],
        default: 'texto'
    },

    // Estado del mensaje
    estado: {
        type: String,
        enum: ['enviando', 'enviado', 'entregado', 'leido', 'error', 'eliminado'],
        default: 'enviado'
    },

    // URL del archivo adjunto (si aplica)
    archivoUrl: {
        type: String,
        trim: true
    },

    // Duración del mensaje (para audio/video)
    duracion: {
        type: Number, // en milisegundos
        min: 0
    },

    // Tamaño del archivo (en bytes)
    tamanoArchivo: {
        type: Number,
        min: 0
    },

    // Metadatos adicionales
    metadatos: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Timestamp de cuando se envió
    timestamp: {
        type: Date,
        default: Date.now
    },

    // Timestamp de cuando se entregó
    entregadoEn: {
        type: Date
    },

    // Timestamp de cuando se leyó
    leidoEn: {
        type: Date
    },

    // Si el mensaje fue eliminado
    eliminado: {
        type: Boolean,
        default: false
    },

    // Timestamp de eliminación
    eliminadoEn: {
        type: Date
    },

    // Usuario que eliminó el mensaje
    eliminadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },

    // Conversación a la que pertenece el mensaje
    conversacion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversacion'
    },

    // Respuesta a otro mensaje (para mensajes de respuesta)
    mensajeRespondido: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mensaje'
    },

    // Reacciones al mensaje
    reacciones: [{
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario'
        },
        tipo: {
            type: String,
            enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
            default: 'like'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Etiquetas del mensaje
    etiquetas: [{
        type: String,
        trim: true
    }],

    // Si el mensaje es importante
    importante: {
        type: Boolean,
        default: false
    },

    // Si el mensaje es privado
    privado: {
        type: Boolean,
        default: false
    },

    // Cifrado del mensaje (si aplica)
    cifrado: {
        type: Boolean,
        default: false
    },

    // Algoritmo de cifrado usado
    algoritmoCifrado: {
        type: String
    }

}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'mensajes'
});

// Índices para mejorar el rendimiento de las consultas
mensajeSchema.index({ emisor: 1, receptor: 1 });
mensajeSchema.index({ receptor: 1, timestamp: -1 });
mensajeSchema.index({ conversacion: 1, timestamp: -1 });
mensajeSchema.index({ estado: 1 });
mensajeSchema.index({ tipo: 1 });
mensajeSchema.index({ timestamp: -1 });
mensajeSchema.index({ eliminado: 1 });

// Métodos de instancia
mensajeSchema.methods.marcarComoEntregado = function () {
    this.estado = 'entregado';
    this.entregadoEn = new Date();
    return this.save();
};

mensajeSchema.methods.marcarComoLeido = function () {
    this.estado = 'leido';
    this.leidoEn = new Date();
    return this.save();
};

mensajeSchema.methods.eliminarMensaje = function (usuarioId) {
    this.eliminado = true;
    this.eliminadoEn = new Date();
    this.eliminadoPor = usuarioId;
    return this.save();
};

mensajeSchema.methods.agregarReaccion = function (usuarioId, tipo) {
    // Remover reacción existente del usuario si existe
    this.reacciones = this.reacciones.filter(
        reaccion => reaccion.usuario.toString() !== usuarioId.toString()
    );

    // Agregar nueva reacción
    this.reacciones.push({
        usuario: usuarioId,
        tipo: tipo,
        timestamp: new Date()
    });

    return this.save();
};

mensajeSchema.methods.removerReaccion = function (usuarioId) {
    this.reacciones = this.reacciones.filter(
        reaccion => reaccion.usuario.toString() !== usuarioId.toString()
    );
    return this.save();
};

// Métodos estáticos
mensajeSchema.statics.obtenerMensajesEntreUsuarios = function (usuario1, usuario2, limite = 50, offset = 0) {
    return this.find({
        $or: [
            { emisor: usuario1, receptor: usuario2 },
            { emisor: usuario2, receptor: usuario1 }
        ],
        eliminado: false
    })
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limite)
        .populate('emisor', 'nombre email online')
        .populate('receptor', 'nombre email online')
        .populate('mensajeRespondido', 'contenido emisor timestamp');
};

mensajeSchema.statics.obtenerMensajesNoLeidos = function (usuarioId) {
    return this.find({
        receptor: usuarioId,
        estado: { $in: ['enviado', 'entregado'] },
        eliminado: false
    })
        .populate('emisor', 'nombre email online')
        .sort({ timestamp: 1 });
};

mensajeSchema.statics.obtenerUltimoMensaje = function (usuario1, usuario2) {
    return this.findOne({
        $or: [
            { emisor: usuario1, receptor: usuario2 },
            { emisor: usuario2, receptor: usuario1 }
        ],
        eliminado: false
    })
        .sort({ timestamp: -1 })
        .populate('emisor', 'nombre email online')
        .populate('receptor', 'nombre email online');
};

// Middleware pre-save para generar ID único si no existe
mensajeSchema.pre('save', function (next) {
    if (!this.id) {
        this.id = new mongoose.Types.ObjectId().toString();
    }
    next();
});

// Middleware pre-find para excluir mensajes eliminados por defecto
mensajeSchema.pre(/^find/, function (next) {
    if (!this.getQuery().eliminado) {
        this.where({ eliminado: { $ne: true } });
    }
    next();
});

// Virtual para obtener el tiempo transcurrido desde el envío
mensajeSchema.virtual('tiempoTranscurrido').get(function () {
    const ahora = new Date();
    const diferencia = ahora.getTime() - this.timestamp.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias > 0) return `${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'Ahora mismo';
});

// Configurar virtuals en JSON
mensajeSchema.set('toJSON', { virtuals: true });
mensajeSchema.set('toObject', { virtuals: true });

const Mensaje = mongoose.model('Mensaje', mensajeSchema);

module.exports = Mensaje; 