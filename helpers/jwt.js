const jwt = require('jsonwebtoken');

// Generar JWT con los datos del usuario
const generateJWT = (user) => {
    return new Promise((resolve, reject) => {
        const payload = { user };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' },
            (err, token) => {
                if (err) {
                    console.error('❌ Error generando JWT:', err);
                    reject('No se pudo generar el token');
                } else {
                    resolve(token);
                }
            }
        );
    });
};

// Verificar JWT token
const verifyJWT = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret',
            (err, decoded) => {
                if (err) {
                    console.error('❌ Error verificando JWT:', err);
                    reject('Token no válido');
                } else {
                    resolve(decoded);
                }
            }
        );
    });
};

// Generar JWT síncrono (versión simple)
const generateJWTSync = (user) => {
    try {
        const payload = { user };

        return jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '30d' }
        );
    } catch (error) {
        console.error('❌ Error generando JWT sync:', error);
        throw new Error('No se pudo generar el token');
    }
};

// Decodificar JWT sin verificar (para debugging)
const decodeJWT = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('❌ Error decodificando JWT:', error);
        return null;
    }
};

// Verificar si un token ha expirado
const isTokenExpired = (token) => {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return true;
        }

        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (error) {
        return true;
    }
};

module.exports = {
    generateJWT,
    verifyJWT,
    generateJWTSync,
    decodeJWT,
    isTokenExpired
};
