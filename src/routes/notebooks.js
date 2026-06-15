import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT nb.*, COUNT(n.id) as note_count
      FROM notebooks nb
      LEFT JOIN notes n ON nb.id = n.notebook_id AND n.is_trashed = 0
      GROUP BY nb.id
      ORDER BY nb.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    await db.execute({ sql: `INSERT INTO notebooks (id, name) VALUES (?, ?)`, args: [id, name.trim()] });
    const result = await db.execute({ sql: `SELECT * FROM notebooks WHERE id = ?`, args: [id] });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    await db.execute({
      sql: `UPDATE notebooks SET name = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [name.trim(), req.params.id],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute({ sql: `DELETE FROM notebooks WHERE id = ?`, args: [req.params.id] });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
