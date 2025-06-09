var SQLite = require('sqlite3').verbose();

var db;
function connectDb(){
  db = new SQLite.Database('./database/sk.db', SQLite.OPEN_READWRITE, (err) =>{
    if(err){
      console.error('Error opening database:', err.message);
    }
    else{
      console.log('Connected to the database.');
    }
  });
  
  return db;
}

module.exports = connectDb();