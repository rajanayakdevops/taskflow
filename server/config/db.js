const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskflow';
  
  try {
    // Attempt connecting to the configured MongoDB URI (local or Atlas)
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Quick timeout to fallback if local mongod is not started
    });
    console.log(`[TaskFlow DB] MongoDB Connected to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.warn(`[TaskFlow DB] Could not connect to primary MongoDB at ${uri}. (${err.message})`);
    
    // In development or test environments, fallback to MongoMemoryServer
    try {
      console.log('[TaskFlow DB] Initializing in-memory MongoDB fallback for seamless local execution...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      
      const conn = await mongoose.connect(memUri);
      console.log(`[TaskFlow DB] Connected to In-Memory MongoDB at: ${memUri}`);
      console.log('[TaskFlow DB] Notice: To persist data permanently, start your local MongoDB or configure MONGODB_URI in .env with your MongoDB Atlas connection string.');
      return conn;
    } catch (memErr) {
      console.error('[TaskFlow DB] Failed to start in-memory database fallback:', memErr.message);
      throw err;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[TaskFlow DB] Database disconnected successfully.');
  } catch (error) {
    console.error('[TaskFlow DB] Error during disconnect:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
