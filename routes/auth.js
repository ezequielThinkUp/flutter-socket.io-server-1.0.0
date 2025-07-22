const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, check, validationResult } = require('express-validator');
const { validarCampos, validarEmail, validarPasswordBasico } = require('../middlewares/validar-campos');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
// @access  Public
router.post('/register', [
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('name', 'El nombre debe tener al menos 2 caracteres').isLength({ min: 2 }),
    ...validarEmail,
    ...validarPasswordBasico,
    validarCampos
], async (req, res) => {
    try {
        console.log('📝 Datos recibidos en el body:', req.body);
        console.log('📝 Headers:', req.headers['content-type']);

        const { name, email, password } = req.body;
        console.log('📋 Datos extraídos:', { name, email, password: password ? '***' : 'undefined' });

        // TODO: Verificar si el usuario ya existe
        // TODO: Crear el usuario en la base de datos

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // TODO: Guardar usuario en MongoDB

        // Generar JWT
        const payload = {
            user: {
                id: 'temp_id', // TODO: Usar ID real del usuario
                name,
                email
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            ok: true,
            msg: 'Usuario registrado exitosamente',
            token,
            user: {
                name,
                email
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', [
    ...validarEmail,
    check('password', 'La contraseña es requerida').not().isEmpty(),
    validarCampos
], async (req, res) => {
    try {

        const { email, password } = req.body;

        // TODO: Buscar usuario en la base de datos
        // TODO: Verificar contraseña

        // Simulación temporal
        const user = {
            id: 'temp_id',
            name: 'Usuario Demo',
            email
        };

        // Verificar contraseña (temporal)
        // const isMatch = await bcrypt.compare(password, user.password);

        // Generar JWT
        const payload = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' }
        );

        res.json({
            ok: true,
            msg: 'Login exitoso',
            token,
            user: {
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
});

// @route   GET /api/auth/renew
// @desc    Renovar token JWT
// @access  Private
router.get('/renew', async (req, res) => {
    try {
        // TODO: Implementar middleware de validación de token

        const token = req.header('x-token');

        if (!token) {
            return res.status(401).json({
                ok: false,
                msg: 'No hay token en la petición'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        // Generar nuevo token
        const payload = {
            user: decoded.user
        };

        const newToken = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' }
        );

        res.json({
            ok: true,
            token: newToken,
            user: decoded.user
        });

    } catch (error) {
        console.error('Error renovando token:', error);
        res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
});

module.exports = router; 