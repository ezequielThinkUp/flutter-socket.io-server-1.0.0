const mongoose = require('mongoose');

const dbConnection = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/flutter_socket_db';

        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// MongoDB configuration options
const mongoConfig = {
    development: {
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/flutter_socket_dev',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    },

    production: {
        uri: process.env.MONGO_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }
    },

    test: {
        uri: process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/flutter_socket_test',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
    }
};

module.exports = {
    dbConnection,
    mongoConfig,
    currentConfig: mongoConfig[process.env.NODE_ENV || 'development']
};
