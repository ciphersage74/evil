import express from 'express';
import cors from 'cors';
import { scrapeBusinessInfo } from './scraper.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/generate-site', async (req, res) => {
  try {
    const { businessName } = req.body ?? {};

    if (!businessName || typeof businessName !== 'string' || businessName.trim().length === 0) {
      return res.status(400).json({ error: 'Le champ "businessName" est requis.' });
    }

    const info = await scrapeBusinessInfo(businessName.trim());
    return res.status(200).json(info);
  } catch (error) {
    console.error('Erreur lors de la génération du site :', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur inconnue';
    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});
