const mongoose = require('mongoose');
require('dotenv').config();

class Database {
    static async connect() {
        try {
            const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/football-web';
            console.log('Attempting to connect to MongoDB...');
            
            await mongoose.connect(mongoUrl, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            
            console.log('✅ MongoDB connected successfully');
            return mongoose.connection;
        } catch (err) {
            console.error('❌ MongoDB connection error:', err.message);
            throw err;
        }
    }

    static async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('MongoDB disconnected');
        } catch (err) {
            console.error('MongoDB disconnection error:', err.message);
        }
    }
}

// برای سازگاری با کدهای قدیمی
const connectDB = Database.connect;

module.exports = { Database, connectDB };
