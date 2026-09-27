const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'showroom.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_code TEXT UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      price INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      color TEXT,
      gearbox TEXT,
      fuel TEXT,
      body_status TEXT,
      engine_status TEXT,
      chassis_status TEXT,
      insurance_months INTEGER DEFAULT 0,
      description TEXT,
      location TEXT,
      phone TEXT,
      whatsapp TEXT,
      is_sold INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      car_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      preferred_time TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;