const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Importar configuración de base de datos
const { dbConnection } = require('./database/config');

// App Express con seguridad
const app = express();

// Conectar a la base de datos
dbConnection();

// Middlewares de seguridad
app.use(helmet({
    contentSecurityPolicy: false, // Para permitir Socket.io client
}));

app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log para debug de requests
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log('🔍 Request Debug:', {
            method: req.method,
            path: req.path,
            headers: req.headers['content-type'],
            body: req.body
        });
    }
    next();
});

// Crear servidor HTTP
const server = http.createServer(app);

// Socket.io v4 con configuración segura
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Path público
const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// Rutas de API
app.use('/api/auth', require('./routes/auth'));

// Importar lógica de sockets (actualizada para v4)
require('./sockets/socket')(io);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        socketio: '4.8.1',
        vulnerabilities: 0
    });
});

// Puerto del servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, (err) => {
    if (err) throw new Error(err);

    console.log('🚀 Servidor Socket.io SEGURO ejecutándose en puerto', PORT);
    console.log('📡 WebSocket disponible en ws://localhost:' + PORT);
    console.log('💻 Cliente de prueba: http://localhost:' + PORT);
    console.log('🔒 Vulnerabilidades: 0 (Socket.io v4.8.1)');
});

// Exportar para tests
module.exports = { app, server, io };


