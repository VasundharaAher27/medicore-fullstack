'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'medicore.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Create Tables ────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS doctor (
    doctor_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    specialization TEXT    DEFAULT '',
    gender         TEXT    DEFAULT 'M',
    phone          TEXT    DEFAULT '',
    email          TEXT    DEFAULT '',
    created_at     TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patient (
    patient_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    age         INTEGER,
    gender      TEXT    DEFAULT 'M',
    phone       TEXT    DEFAULT '',
    email       TEXT    DEFAULT '',
    address     TEXT    DEFAULT '',
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointment (
    appt_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id  INTEGER NOT NULL,
    appt_date  TEXT    NOT NULL,
    status     TEXT    DEFAULT 'Scheduled',
    notes      TEXT    DEFAULT '',
    created_at TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id)  ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctor(doctor_id)    ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS medicine (
    med_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    med_name   TEXT    NOT NULL,
    category   TEXT    DEFAULT '',
    price      REAL    DEFAULT 0,
    stock      INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS prescription (
    presc_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    appt_id    INTEGER NOT NULL,
    med_id     INTEGER NOT NULL,
    quantity   INTEGER DEFAULT 1,
    notes      TEXT    DEFAULT '',
    created_at TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (appt_id) REFERENCES appointment(appt_id) ON DELETE CASCADE,
    FOREIGN KEY (med_id)  REFERENCES medicine(med_id)     ON DELETE CASCADE
  );
`);

// ─── Seed Data (only if tables are empty) ────────────────────
const docCount = db.prepare('SELECT COUNT(*) AS c FROM doctor').get().c;
if (docCount === 0) {
  db.exec(`
    INSERT INTO doctor (name,specialization,gender,phone,email) VALUES
      ('Sarah Chen',    'Cardiology',  'F','555-0101','s.chen@medicore.com'),
      ('Marcus Rivera', 'Neurology',   'M','555-0102','m.rivera@medicore.com'),
      ('Priya Patel',   'Pediatrics',  'F','555-0103','p.patel@medicore.com'),
      ('David Okonkwo', 'Orthopedics', 'M','555-0104','d.okonkwo@medicore.com');

    INSERT INTO patient (name,age,gender,phone,email,address) VALUES
      ('James Wilson',  52,'M','555-1001','j.wilson@email.com', '12 Oak Street, Springfield'),
      ('Amara Osei',    34,'F','555-1002','a.osei@email.com',   '45 Maple Ave, Riverside'),
      ('Lucas Hoffman',  8,'M','555-1003','l.hoffman@email.com','78 Pine Road, Lakewood'),
      ('Elena Vasquez', 41,'F','555-1004','e.vasquez@email.com','33 Cedar Blvd, Hillview');

    INSERT INTO medicine (med_name,category,price,stock) VALUES
      ('Amoxicillin 500mg', 'Antibiotic',   12.50, 200),
      ('Lisinopril 10mg',   'Cardiac',       8.00, 150),
      ('Paracetamol 500mg', 'Analgesic',     3.00, 500),
      ('Aspirin 100mg',     'Cardiac',       4.25, 300),
      ('Metformin 500mg',   'Antidiabetic',  6.75, 180),
      ('Cetirizine 10mg',   'Antihistamine', 5.50, 220);

    INSERT INTO appointment (patient_id,doctor_id,appt_date,status,notes) VALUES
      (1,1,'2026-02-20 09:00','Completed','Follow-up for hypertension'),
      (2,2,'2026-02-22 14:30','Scheduled','Initial consultation for migraines'),
      (3,3,'2026-02-23 11:00','Scheduled','Annual checkup'),
      (1,2,'2026-02-18 10:00','Completed','Neurological assessment'),
      (4,1,'2026-02-25 16:00','Scheduled','Blood pressure monitoring');

    INSERT INTO prescription (appt_id,med_id,quantity,notes) VALUES
      (1,2,30,'Take once daily in the morning'),
      (1,4,60,'One tablet daily, do not exceed'),
      (4,3,20,'As needed for headache, max 4/day'),
      (3,1,14,'Complete full course, twice daily');
  `);
  console.log('✅  Database seeded with sample data');
}

module.exports = db;
