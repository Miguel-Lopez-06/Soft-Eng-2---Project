const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/sk.db'); // Replace with your database file path

db.serialize(() => {
  // Add the Status column
  db.run(
    `ALTER TABLE comments ADD COLUMN Status TEXT CHECK(Status IN ('approved', 'flagged')) DEFAULT 'approved';`,
    (err) => {
      if (err) {
        console.error('Error adding Status column:', err.message);
      } else {
        console.log('Status column added successfully.');
      }
    }
  );

  // Add the isArchived column
  db.run(
    `ALTER TABLE comments ADD COLUMN isArchived BOOLEAN DEFAULT 0;`,
    (err) => {
        if (err) {
            console.error('Error adding isArchived column:', err.message);
        } else {
            console.log('isArchived column added successfully.');
        }
    }
  );
  
  // Verify the table schema
  db.all(`PRAGMA table_info(comments);`, (err, rows) => {
    if (err) {
      console.error('Error fetching table info:', err.message);
    } else {
      console.log('Table schema:', rows);
    }
  });
});

db.close();