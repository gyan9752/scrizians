// const mongoose = require('mongoose');

// mongoose.set('bufferCommands', false);

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scrizians', {
//       serverSelectionTimeoutMS: 2000,
//     });
//     console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
//   } catch (error) {
//     console.warn(`[MongoDB Warning] Database connection offline: ${error.message}`);
//     console.log('[MongoDB] Running in-memory dev mode fallback.');
//   }
// };

// module.exports = connectDB;



const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 5000,
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE) || 1,
      socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45000,
      family: 4
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;