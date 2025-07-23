const { response } = require('express');
const bcryptjs = require('bcryptjs');
const Usuario = require('../models/usuario');

// Importar helper JWT
const { generateJWTSync } = require('../helpers/jwt');

const crearUsuario = async (req, res = response) => {
    try {
        console.log('📝 Creando usuario con datos:', req.body);

        const { name, email, password } = req.body;

        // Verificar si ya existe un usuario con ese email
        const existeUsuario = await Usuario.findOne({ email });
        if (existeUsuario) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe un usuario con ese email'
            });
        }

        // Encriptar password con bcrypt
        const salt = bcryptjs.genSaltSync(10);
        const passwordEncriptado = bcryptjs.hashSync(password, salt);

        // Crear el usuario con password encriptado
        const usuario = new Usuario({
            name,
            email,
            password: passwordEncriptado
        });

        // IMPORTANTE: Usar await para guardar realmente en la DB
        const usuarioGuardado = await usuario.save();
        console.log('✅ Usuario guardado en MongoDB:', usuarioGuardado._id);

        // Generar token usando el helper JWT
        const token = generateJWTSync({
            id: usuarioGuardado._id,
            name: usuarioGuardado.name,
            email: usuarioGuardado.email
        });

        res.status(201).json({
            ok: true,
            msg: 'Usuario registrado exitosamente',
            token,
            user: usuarioGuardado // El password se omite automáticamente por el toJSON del modelo
        });

    } catch (error) {
        console.error('❌ Error al crear usuario:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                msg: 'El email ya está registrado'
            });
        }

        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

module.exports = {
    crearUsuario
};
