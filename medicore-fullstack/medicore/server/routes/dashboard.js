'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET aggregated dashboard counts
router.get('/', (req, res) => {
  const row = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM doctor)       AS docs,
      (SELECT COUNT(*) FROM patient)      AS pats,
      (SELECT COUNT(*) FROM appointment)  AS apts,
      (SELECT COUNT(*) FROM prescription) AS prss,
      (SELECT COUNT(*) FROM medicine)     AS meds
  `).get();
  res.json(row);
});

module.exports = router;
