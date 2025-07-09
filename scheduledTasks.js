const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/sk.db');

function archiveOldFlaggedComments() {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  db.run(
    `UPDATE comments SET isArchived = 1 WHERE Status = 'flagged' AND CommentDate <= ? AND isArchived = 0`,
    [oneYearAgo.toISOString()],
    function (err) {
      if (err) {
        console.error('Error archiving old flagged comments:', err.message);
      } else {
        console.log(`Archived ${this.changes} old flagged comments.`);
      }
    }
  );
}

// Run the task every 24 hours
setInterval(archiveOldFlaggedComments, 24 * 60 * 60 * 1000);

console.log('Scheduled task for archiving old comments is running.');