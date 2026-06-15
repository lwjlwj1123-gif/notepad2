import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { view = 'all', notebook_id, tag_id, search } = req.query;

    let where = ['1=1'];
    const args = [];

    if (view === 'starred') {
      where.push('n.is_starred = 1');
      where.push('n.is_trashed = 0');
    } else if (view === 'trash') {
      where.push('n.is_trashed = 1');
    } else {
      where.push('n.is_trashed = 0');
    }

    if (notebook_id) {
      where.push('n.notebook_id = ?');
      args.push(notebook_id);
    }

    if (search) {
      where.push('(n.title LIKE ? OR n.content LIKE ?)');
      args.push(`%${search}%`, `%${search}%`);
    }

    let sql = `
      SELECT n.id, n.title, n.content, n.notebook_id, n.is_starred, n.is_trashed,
             n.created_at, n.updated_at, nb.name as notebook_name,
             GROUP_CONCAT(t.name) as tag_names
      FROM notes n
      LEFT JOIN notebooks nb ON n.notebook_id = nb.id
      LEFT JOIN note_tags nt ON n.id = nt.note_id
      LEFT JOIN tags t ON nt.tag_id = t.id
    `;

    if (tag_id) {
      sql = `
        SELECT n.id, n.title, n.content, n.notebook_id, n.is_starred, n.is_trashed,
               n.created_at, n.updated_at, nb.name as notebook_name,
               GROUP_CONCAT(t.name) as tag_names
        FROM notes n
        JOIN note_tags nt2 ON n.id = nt2.note_id AND nt2.tag_id = ?
        LEFT JOIN notebooks nb ON n.notebook_id = nb.id
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
      `;
      args.unshift(tag_id);
    }

    sql += ` WHERE ${where.join(' AND ')} GROUP BY n.id ORDER BY n.updated_at DESC`;

    const result = await db.execute({ sql, args });
    const notes = result.rows.map((r) => ({
      ...r,
      is_starred: Boolean(r.is_starred),
      is_trashed: Boolean(r.is_trashed),
      tags: r.tag_names ? r.tag_names.split(',') : [],
    }));
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.execute({
      sql: `SELECT n.*, nb.name as notebook_name FROM notes n
            LEFT JOIN notebooks nb ON n.notebook_id = nb.id
            WHERE n.id = ?`,
      args: [req.params.id],
    });
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });

    const tagResult = await db.execute({
      sql: `SELECT t.id, t.name FROM tags t
            JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = ?`,
      args: [req.params.id],
    });

    const note = {
      ...result.rows[0],
      is_starred: Boolean(result.rows[0].is_starred),
      is_trashed: Boolean(result.rows[0].is_trashed),
      tags: tagResult.rows,
    };
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const { title = '', content = '', notebook_id = null } = req.body;
    await db.execute({
      sql: `INSERT INTO notes (id, title, content, notebook_id) VALUES (?, ?, ?, ?)`,
      args: [id, title, content, notebook_id],
    });
    const result = await db.execute({ sql: `SELECT * FROM notes WHERE id = ?`, args: [id] });
    res.status(201).json({ ...result.rows[0], tags: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content, notebook_id, tags } = req.body;
    await db.execute({
      sql: `UPDATE notes SET title = ?, content = ?, notebook_id = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [title, content, notebook_id ?? null, req.params.id],
    });

    if (Array.isArray(tags)) {
      await db.execute({ sql: `DELETE FROM note_tags WHERE note_id = ?`, args: [req.params.id] });
      for (const name of tags) {
        const trimmed = name.trim();
        if (!trimmed) continue;
        const tagId = crypto.randomUUID();
        await db.execute({
          sql: `INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)`,
          args: [tagId, trimmed],
        });
        const tagRow = await db.execute({ sql: `SELECT id FROM tags WHERE name = ?`, args: [trimmed] });
        await db.execute({
          sql: `INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`,
          args: [req.params.id, tagRow.rows[0].id],
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/star', async (req, res) => {
  try {
    await db.execute({
      sql: `UPDATE notes SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ?`,
      args: [req.params.id],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/trash', async (req, res) => {
  try {
    await db.execute({
      sql: `UPDATE notes SET is_trashed = CASE WHEN is_trashed = 1 THEN 0 ELSE 1 END WHERE id = ?`,
      args: [req.params.id],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.execute({ sql: `DELETE FROM notes WHERE id = ?`, args: [req.params.id] });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
