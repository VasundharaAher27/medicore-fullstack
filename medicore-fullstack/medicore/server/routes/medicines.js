'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET all medicines (with times_prescribed count)
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const rows = db.prepare(`
    SELECT m.*,
           COUNT(pr.presc_id) AS times_prescribed
    FROM medicine m
    LEFT JOIN prescription pr ON pr.med_id = m.med_id
    WHERE m.med_name LIKE ? OR m.category LIKE ?
    GROUP BY m.med_id
    ORDER BY m.med_id DESC
  `).all(`%${q}%`, `%${q}%`);
  res.json(rows);
});

// GET single medicine
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM medicine WHERE med_id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Medicine not found' });
  res.json(row);
});

// POST create medicine
router.post('/', (req, res) => {
  const { med_name, category = '', price = 0, stock = 0 } = req.body;
  if (!med_name || !med_name.trim()) return res.status(400).json({ error: 'Medicine name is required' });
  const info = db.prepare(
    'INSERT INTO medicine (med_name,category,price,stock) VALUES (?,?,?,?)'
  ).run(med_name.trim(), category, parseFloat(price) || 0, parseInt(stock) || 0);
  res.status(201).json({ med_id: info.lastInsertRowid });
});

// PUT update medicine
router.put('/:id', (req, res) => {
  const { med_name, category = '', price = 0, stock = 0 } = req.body;
  if (!med_name || !med_name.trim()) return res.status(400).json({ error: 'Medicine name is required' });
  const info = db.prepare(
    'UPDATE medicine SET med_name=?,category=?,price=?,stock=? WHERE med_id=?'
  ).run(med_name.trim(), category, parseFloat(price) || 0, parseInt(stock) || 0, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Medicine not found' });
  res.json({ updated: true });
});

// DELETE medicine
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM medicine WHERE med_id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Medicine not found' });
  res.json({ deleted: true });
});

module.exports = router;
