'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET all patients
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const rows = db.prepare(`
    SELECT p.*,
           COUNT(a.appt_id) AS appt_count
    FROM patient p
    LEFT JOIN appointment a ON a.patient_id = p.patient_id
    WHERE p.name LIKE ? OR p.email LIKE ? OR p.phone LIKE ?
    GROUP BY p.patient_id
    ORDER BY p.patient_id DESC
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(rows);
});

// GET single patient
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM patient WHERE patient_id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Patient not found' });
  res.json(row);
});

// POST create patient
router.post('/', (req, res) => {
  const { name, age = null, gender = 'M', phone = '', email = '', address = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const info = db.prepare(
    'INSERT INTO patient (name,age,gender,phone,email,address) VALUES (?,?,?,?,?,?)'
  ).run(name.trim(), age || null, gender, phone, email, address);
  res.status(201).json({ patient_id: info.lastInsertRowid });
});

// PUT update patient
router.put('/:id', (req, res) => {
  const { name, age = null, gender = 'M', phone = '', email = '', address = '' } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const info = db.prepare(
    'UPDATE patient SET name=?,age=?,gender=?,phone=?,email=?,address=? WHERE patient_id=?'
  ).run(name.trim(), age || null, gender, phone, email, address, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Patient not found' });
  res.json({ updated: true });
});

// DELETE patient
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM patient WHERE patient_id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Patient not found' });
  res.json({ deleted: true });
});

module.exports = router;
