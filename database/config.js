const mongoose = require('mongoose');

const dbConnection = async () => {
    try {
        const mongoURI = process.env.DB_CNN || 'mongodb://localhost:27017/flutter_socket_db';

        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB connected successfully');
        console.log('🔗 Database URI:', mongoURI.replace(/mongodb:\/\/.*@/, 'mongodb://***:***@'));
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// MongoDB configuration options
const mongoConfig = {
    development: {
        uri: process.env.DB_CNN || 'mongodb://localhost:27017/flutter_socket_dev',
        options: {}
    },

    production: {
        uri: process.env.DB_CNN,
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }
    },

    test: {
        uri: process.env.DB_CNN_TEST || 'mongodb://localhost:27017/flutter_socket_test',
        options: {}
    }
};

module.exports = {
    dbConnection,
    mongoConfig,
    currentConfig: mongoConfig[process.env.NODE_ENV || 'development']
};
