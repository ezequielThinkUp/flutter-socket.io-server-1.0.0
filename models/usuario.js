const { Schema, model } = require('mongoose');

const usuarioSchema = Schema({
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre debe tener máximo 50 caracteres']
    },

    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'El formato del email no es válido']
    },

    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },

    online: {
        type: Boolean,
        default: false
    },

    avatar: {
        type: String,
        default: null
    },

    role: {
        type: String,
        enum: ['USER_ROLE', 'ADMIN_ROLE'],
        default: 'USER_ROLE'
    },

    isActive: {
        type: Boolean,
        default: true
    },

    lastLogin: {
        type: Date,
        default: null
    }

}, {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    versionKey: false // Elimina __v
});

// Índices para mejorar performance
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ online: 1 });
usuarioSchema.index({ isActive: 1 });

// Método para no devolver la password en JSON
usuarioSchema.methods.toJSON = function () {
    const { password, ...usuario } = this.toObject();
    return usuario;
};

// Método estático para encontrar usuarios activos
usuarioSchema.statics.findActiveUsers = function () {
    return this.find({ isActive: true });
};

// Método para verificar si el usuario está online
usuarioSchema.methods.isOnline = function () {
    return this.online;
};

module.exports = model('Usuario', usuarioSchema);
