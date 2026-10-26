'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET all prescriptions (join 5 tables)
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const rows = db.prepare(`
    SELECT pr.*,
           m.med_name,
           p.name  AS patient_name,
           d.name  AS doctor_name
    FROM prescription pr
    JOIN medicine    m ON m.med_id     = pr.med_id
    JOIN appointment a ON a.appt_id   = pr.appt_id
    JOIN patient     p ON p.patient_id = a.patient_id
    JOIN doctor      d ON d.doctor_id  = a.doctor_id
    WHERE p.name LIKE ? OR m.med_name LIKE ? OR d.name LIKE ?
    ORDER BY pr.presc_id DESC
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(rows);
});

// GET recent 5 for dashboard
router.get('/recent', (req, res) => {
  const rows = db.prepare(`
    SELECT pr.presc_id, pr.quantity,
           m.med_name,
           p.name AS patient_name,
           d.name AS doctor_name
    FROM prescription pr
    JOIN medicine    m ON m.med_id     = pr.med_id
    JOIN appointment a ON a.appt_id   = pr.appt_id
    JOIN patient     p ON p.patient_id = a.patient_id
    JOIN doctor      d ON d.doctor_id  = a.doctor_id
    ORDER BY pr.presc_id DESC LIMIT 5
  `).all();
  res.json(rows);
});

// GET single prescription
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM prescription WHERE presc_id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Prescription not found' });
  res.json(row);
});

// POST create prescription
router.post('/', (req, res) => {
  const { appt_id, med_id, quantity = 1, notes = '' } = req.body;
  if (!appt_id || !med_id)
    return res.status(400).json({ error: 'appt_id and med_id are required' });
  const info = db.prepare(
    'INSERT INTO prescription (appt_id,med_id,quantity,notes) VALUES (?,?,?,?)'
  ).run(appt_id, med_id, parseInt(quantity) || 1, notes);
  res.status(201).json({ presc_id: info.lastInsertRowid });
});

// PUT update prescription
router.put('/:id', (req, res) => {
  const { appt_id, med_id, quantity = 1, notes = '' } = req.body;
  if (!appt_id || !med_id)
    return res.status(400).json({ error: 'appt_id and med_id are required' });
  const info = db.prepare(
    'UPDATE prescription SET appt_id=?,med_id=?,quantity=?,notes=? WHERE presc_id=?'
  ).run(appt_id, med_id, parseInt(quantity) || 1, notes, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Prescription not found' });
  res.json({ updated: true });
});

// DELETE prescription
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM prescription WHERE presc_id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Prescription not found' });
  res.json({ deleted: true });
});

module.exports = router;
