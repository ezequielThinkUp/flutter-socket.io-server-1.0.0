const { response } = require('express');
const { verifyJWT } = require('../helpers/jwt');

const validarJWT = async (req, res = response, next) => {
    try {
        // Obtener token del header
        const token = req.header('x-token');

        if (!token) {
            return res.status(401).json({
                ok: false,
                msg: 'No hay token en la petición'
            });
        }

        // Verificar token usando el helper
        const decoded = await verifyJWT(token);

        // Agregar información del usuario al request
        req.user = decoded.user;
        req.token = token;

        // Continuar con el siguiente middleware o controlador
        next();

    } catch (error) {
        console.error('❌ Error validando JWT:', error);
        res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
};

module.exports = {
    validarJWT
};
