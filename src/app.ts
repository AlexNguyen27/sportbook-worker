import express from 'express';
import { logger } from 'juno-js';

import { executeJobs } from './jobs';
import { config } from './components';

const createApp = () => {
  const app = express();
  app.get('/', (req, res) => res.send('Chao xìn 🇻🇳'));
  const PORT = config.port;
  app.listen(PORT, () => {
    logger.info(`⚡️[server]: Server is running at https://0.0.0.0:${PORT}`);
  });
  executeJobs();
};

export { createApp };
