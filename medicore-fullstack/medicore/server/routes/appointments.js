'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET all appointments (with patient + doctor names)
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  const rows = db.prepare(`
    SELECT a.*,
           p.name AS patient_name,
           d.name AS doctor_name
    FROM appointment a
    JOIN patient p ON p.patient_id = a.patient_id
    JOIN doctor  d ON d.doctor_id  = a.doctor_id
    WHERE p.name LIKE ? OR d.name LIKE ? OR a.status LIKE ? OR a.notes LIKE ?
    ORDER BY a.appt_id DESC
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  res.json(rows);
});

// GET recent 5 for dashboard
router.get('/recent', (req, res) => {
  const rows = db.prepare(`
    SELECT a.appt_id, a.appt_date, a.status,
           p.name AS patient_name,
           d.name AS doctor_name
    FROM appointment a
    JOIN patient p ON p.patient_id = a.patient_id
    JOIN doctor  d ON d.doctor_id  = a.doctor_id
    ORDER BY a.appt_id DESC LIMIT 5
  `).all();
  res.json(rows);
});

// GET single appointment
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM appointment WHERE appt_id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Appointment not found' });
  res.json(row);
});

// POST create appointment
router.post('/', (req, res) => {
  const { patient_id, doctor_id, appt_date, status = 'Scheduled', notes = '' } = req.body;
  if (!patient_id || !doctor_id || !appt_date)
    return res.status(400).json({ error: 'patient_id, doctor_id and appt_date are required' });
  const info = db.prepare(
    'INSERT INTO appointment (patient_id,doctor_id,appt_date,status,notes) VALUES (?,?,?,?,?)'
  ).run(patient_id, doctor_id, appt_date, status, notes);
  res.status(201).json({ appt_id: info.lastInsertRowid });
});

// PUT update appointment
router.put('/:id', (req, res) => {
  const { patient_id, doctor_id, appt_date, status = 'Scheduled', notes = '' } = req.body;
  if (!patient_id || !doctor_id || !appt_date)
    return res.status(400).json({ error: 'patient_id, doctor_id and appt_date are required' });
  const info = db.prepare(
    'UPDATE appointment SET patient_id=?,doctor_id=?,appt_date=?,status=?,notes=? WHERE appt_id=?'
  ).run(patient_id, doctor_id, appt_date, status, notes, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ updated: true });
});

// DELETE appointment
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM appointment WHERE appt_id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ deleted: true });
});

module.exports = router;
