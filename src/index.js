import 'dotenv/config';

// 로컬 개발 환경에서 회사 네트워크 SSL 프록시 우회 (프로덕션 미적용)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb } from './db.js';
import notesRouter from './routes/notes.js';
import notebooksRouter from './routes/notebooks.js';
import tagsRouter from './routes/tags.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/notes', notesRouter);
app.use('/api/notebooks', notebooksRouter);
app.use('/api/tags', tagsRouter);

if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

await initDb();
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
