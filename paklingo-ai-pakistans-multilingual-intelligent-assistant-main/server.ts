import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Routers
import { adminRouter } from './server/adminRoutes.js';
import { authRouter } from './server/authRoutes.js';
import { governmentRouter } from './server/routes/governmentRoutes.js';
import { chatRouter } from './server/routes/chatRoutes.js';
import { teacherRouter } from './server/routes/teacherRoutes.js';
import { medicalRouter } from './server/routes/medicalRoutes.js';
import { legalRouter } from './server/routes/legalRoutes.js';
import { farmerRouter } from './server/routes/farmerRoutes.js';
import { translateRouter } from './server/routes/translateRoutes.js';
import { ttsRouter } from './server/routes/ttsRoutes.js';
import { factCheckRouter } from './server/routes/factCheckRoutes.js';
import { pslRouter } from './server/routes/pslRoutes.js';
import { documentRouter } from './server/routes/documentRoutes.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Mount domain routes
app.use(authRouter);
app.use(adminRouter);
app.use(governmentRouter);
app.use(chatRouter);
app.use(teacherRouter);
app.use(medicalRouter);
app.use(legalRouter);
app.use(farmerRouter);
app.use(translateRouter);
app.use(ttsRouter);
app.use(factCheckRouter);
app.use(pslRouter);
app.use(documentRouter);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PakLingo AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
