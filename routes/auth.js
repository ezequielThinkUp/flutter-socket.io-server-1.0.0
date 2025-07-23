const express = require('express');
const { body, check, validationResult } = require('express-validator');
const { validarCampos, validarEmail, validarPasswordBasico } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');

// Importar controladores
const { crearUsuario, loginUsuario, renovarToken } = require('../controllers/auth');

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
], crearUsuario);

// @route   POST /api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', [
    ...validarEmail,
    check('password', 'La contraseña es requerida').not().isEmpty(),
    validarCampos
], loginUsuario);

// @route   GET /api/auth/renew
// @desc    Renovar token JWT
// @access  Private
router.get('/renew', validarJWT, renovarToken);

module.exports = router; 