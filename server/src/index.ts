import app from './app';
import { config } from './config';
import prisma from './config/prisma';

const startServer = async () => {
  try {
    // Check DB connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully.');

    app.listen(config.port, () => {
      console.log(`🚀 GarmentFlow Server running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
