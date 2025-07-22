const { response } = require('express');
const { validationResult, check } = require('express-validator');

const validarCampos = (req, res = response, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log('❌ Errores de validación encontrados:', errors.array());
        return res.status(400).json({
            ok: false,
            msg: 'Error en la validación de campos',
            errors: errors.array()
        });
    }

    next();
};

// Validaciones personalizadas para email
const validarEmail = [
    check('email', 'El email es obligatorio').not().isEmpty(),
    check('email', 'El formato del email no es válido').isEmail(),
    check('email', 'El email debe tener entre 5 y 100 caracteres').isLength({ min: 5, max: 100 }),
    check('email').normalizeEmail() // Normaliza el email (convierte a lowercase, etc.)
];

// Validaciones personalizadas para password
const validarPassword = [
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('password', 'La contraseña debe tener máximo 50 caracteres').isLength({ max: 50 }),
    check('password', 'La contraseña debe contener al menos una letra mayúscula')
        .matches(/[A-Z]/)
        .optional({ checkFalsy: false }), // Solo aplica si no está vacío
    check('password', 'La contraseña debe contener al menos un número')
        .matches(/\d/)
        .optional({ checkFalsy: false }),
    check('password', 'La contraseña no puede contener espacios en blanco')
        .not()
        .matches(/\s/)
];

// Validaciones básicas para password (menos restrictiva)
const validarPasswordBasico = [
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('password', 'La contraseña debe tener máximo 50 caracteres').isLength({ max: 50 }),
    check('password', 'La contraseña no puede contener espacios en blanco')
        .not()
        .matches(/\s/)
];

// Validación para confirmar password
const validarConfirmPassword = [
    check('confirmPassword', 'La confirmación de contraseña es obligatoria').not().isEmpty(),
    check('confirmPassword').custom((confirmPassword, { req }) => {
        if (confirmPassword !== req.body.password) {
            throw new Error('Las contraseñas no coinciden');
        }
        return true;
    })
];

// Validación personalizada para verificar formato de email específico
const validarEmailPersonalizado = (req, res, next) => {
    const { email } = req.body;

    if (email) {
        // Verificar que no tenga dominios temporales o sospechosos
        const dominiosProhibidos = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
        const dominio = email.split('@')[1];

        if (dominiosProhibidos.includes(dominio)) {
            return res.status(400).json({
                ok: false,
                msg: 'No se permiten emails temporales',
                errors: [{
                    msg: 'El dominio del email no está permitido',
                    param: 'email'
                }]
            });
        }
    }

    next();
};

module.exports = {
    validarCampos,
    validarEmail,
    validarPassword,
    validarPasswordBasico,
    validarConfirmPassword,
    validarEmailPersonalizado
};
