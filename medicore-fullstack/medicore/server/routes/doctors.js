'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET all doctors (with appointment count)
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const rows = db.prepare(`
    SELECT d.*,
           COUNT(a.appt_id) AS appt_count
    FROM doctor d
    LEFT JOIN appointment a ON a.doctor_id = d.doctor_id
    WHERE d.name LIKE ? OR d.specialization LIKE ? OR d.email LIKE ?
    GROUP BY d.doctor_id
    ORDER BY d.doctor_id DESC
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(rows);
});

// GET single doctor
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM doctor WHERE doctor_id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Doctor not found' });
  res.json(row);
});

// POST create doctor
router.post('/', (req, res) => {
  const { name, specialization = '', gender = 'M', phone = '', email = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const info = db.prepare(
    'INSERT INTO doctor (name,specialization,gender,phone,email) VALUES (?,?,?,?,?)'
  ).run(name.trim(), specialization, gender, phone, email);
  res.status(201).json({ doctor_id: info.lastInsertRowid });
});

// PUT update doctor
router.put('/:id', (req, res) => {
  const { name, specialization = '', gender = 'M', phone = '', email = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const info = db.prepare(
    'UPDATE doctor SET name=?,specialization=?,gender=?,phone=?,email=? WHERE doctor_id=?'
  ).run(name.trim(), specialization, gender, phone, email, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Doctor not found' });
  res.json({ updated: true });
});

// DELETE doctor (cascade removes appointments + prescriptions)
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM doctor WHERE doctor_id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Doctor not found' });
  res.json({ deleted: true });
});

module.exports = router;
