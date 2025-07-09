var express = require('express');
var router = express.Router();
var con = require('../config/db');
var fs = require('fs'); // Import the fs module to read the file

// Load the list of swear words from swearwords.txt
const swearWordsFilePath = './routes/swearwords.txt'; // File is in the same folder as rIndex.js
let swearWords = [];

// Read the swearwords.txt file and load its contents into an array
try {
  const fileContents = fs.readFileSync(swearWordsFilePath, 'utf8');
  swearWords = fileContents.split(/\r?\n/).map(word => word.trim().toLowerCase());
  console.log('Loaded swear words:', swearWords);
} catch (err) {
  console.error('Error reading swearwords.txt:', err);
}

// Utility function to censor profanity
function censorWord(word) {
  if (word.length <= 2) return word; // Skip short words
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

// Utility function to check and censor profanity in a comment
function filterProfanity(text) {
  const words = text.split(/\s+/); // Split the text into words
  let containsProfanity = false;

  console.log('Original text:', text); // Debugging: Log the original text
  console.log('Words in text:', words); // Debugging: Log the split words

  const censoredWords = words.map((word) => {
    // Normalize the word: Convert to lowercase, trim spaces, and remove leading/trailing punctuation
    const normalizedWord = word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');
    console.log('Normalized word:', normalizedWord); // Debugging: Log the normalized word

    if (swearWords.includes(normalizedWord)) {
      containsProfanity = true;
      console.log(`Profanity detected: ${normalizedWord}`); // Debugging: Log detected profanity
      return censorWord(word); // Censor the word
    }
    return word;
  });

  console.log('Censored text:', censoredWords.join(' ')); // Debugging: Log the censored text
  return { censoredText: censoredWords.join(' '), containsProfanity };
}

const loadData = (tableNames) => {
  const selectQuery = tableNames.map((tableName) => {
    return new Promise((resolve, reject) => {
      con.all(`SELECT * FROM \`${tableName}\``, function (err, rows) {
        if (err) {
          console.error(`Cannot load ${tableName} data`, err);
          reject({ err, tableName });
        } else {
          resolve(rows);
        }
      });
    });
  });

  return Promise.all(selectQuery);
};

const loadAnnc = (id) => {
  const announcementsQuery = new Promise((resolve, reject) => {
    con.all('SELECT * FROM announcement WHERE AnnouncementID = ?', [id], function (err, rows) {
      if (err) {
        console.error('Cannot load announcements data');
        reject(err);
      }
      resolve(rows);
    });
  });
  const galImagesQuery = new Promise((resolve, reject) => {
    con.all('SELECT * FROM `gallery images` WHERE AnnouncementID = ? ORDER BY Pos ASC', [id], function (err, rows) {
      if (err) {
        console.error('Cannot load images data');
        reject(err);
      }
      resolve(rows);
    });
  });
  const commentsQuery = new Promise((resolve, reject) => {
    con.all('SELECT * FROM comments WHERE AnnouncementID = ?', [id], function (err, rows) {
      if (err) {
        console.error('Cannot load comments data');
        reject(err);
      }
      resolve(rows);
    });
  });

  return Promise.all([announcementsQuery, galImagesQuery, commentsQuery]);
};

// HOME
router.get('/', function (req, res) {
  loadData(['announcement', 'gallery images', 'comments', 'council members'])
    .then(([announcements, galImages, comments, councilMembers]) => {
      res.render('home', {
        announcements: announcements || [],
        galImages: galImages || [],
        comments: comments || [],
        councilMembers: councilMembers || [],
      });
    })
    .catch(err => {
      console.error('Cannot load data', err);
      res.status(500).json({ success: false, message: 'Cannot load data' });
    });
});

// ABOUT US
router.get('/AboutUs', function (req, res) {
  loadData(['council members'])
    .then(([councilMembers]) => {
      res.render('aboutUs', {
        councilMembers: councilMembers || [],
      });
    })
    .catch((err) => {
      console.error(`Cannot load data`, err);
      res.status(500).json({ success: false, message: `Cannot load data` });
    });
});

// ANNOUNCEMENTS
router.get('/Announcement', function (req, res) {
  loadData(['announcement', 'gallery images', 'comments'])
    .then(([announcements, galImages, comments]) => {
      res.render('announcement', {
        announcements: announcements || [],
        galImages: galImages || [],
        comments: comments || [],
      });
    })
    .catch(err => {
      console.error('Cannot load data', err);
      res.status(500).json({ success: false, message: 'Cannot load data' });
    });
});
router.get('/Announcement/:id', function (req, res) {
  const { id } = req.params;

  loadAnnc(id)
    .then(([announcement, galImages, comments]) => {
      res.render('anncFocus', {
        id,
        announcement: announcement[0] || [],
        galImages: galImages || [],
        comments: comments || [],
      });
    })
    .catch(err => {
      console.error('Cannot load data', err);
      res.status(500).json({ success: false, message: 'Cannot load data' });
    });
});

// In rIndex.js

router.get('/Announcement/:id/getComments', function (req, res) {
    const { id } = req.params;

    // First, get all top-level comments (those without a parent)
    const sqlParent = 'SELECT * FROM comments WHERE AnnouncementID = ? AND ParentCommentID IS NULL AND isArchived = 0 ORDER BY CommentDate DESC';

    con.all(sqlParent, [id], function (err, parentComments) {
        if (err) {
            console.error('Error fetching parent comments:', err);
            return res.status(500).json({ success: false, message: 'Server error.' });
        }

        // If there are no parent comments, return an empty array
        if (parentComments.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // For each parent comment, create a promise to fetch its replies
        const promises = parentComments.map(parent => {
            return new Promise((resolve, reject) => {
                const sqlReplies = 'SELECT * FROM comments WHERE ParentCommentID = ? AND isArchived = 0 ORDER BY CommentDate ASC';
                con.all(sqlReplies, [parent.CommentID], (err, replies) => {
                    if (err) return reject(err);
                    
                    // Attach the replies to the parent comment object
                    parent.replies = replies || []; 
                    resolve(parent);
                });
            });
        });

        // Once all reply queries are finished, send the complete nested data
        Promise.all(promises)
            .then(data => {
                res.status(200).json({ success: true, data: data });
            })
            .catch(error => {
                console.error('Error fetching replies:', error);
                res.status(500).json({ success: false, message: 'Server error fetching replies.' });
            });
    });
});

router.post('/Announcement/:id/addComment', function (req, res) {
  const { id } = req.params;
  const { text, parentId = null } = req.body;

  // No AdminID is needed here, as per your application logic.

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required.' });
  }

  const { censoredText, containsProfanity } = filterProfanity(text);
  const commentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const status = containsProfanity ? 'flagged' : 'approved';

  // The SQL query is now simpler and does NOT include AdminID.
  const sql = 'INSERT INTO comments (AnnouncementID, Text, CommentDate, Status, ParentCommentID) VALUES (?, ?, ?, ?, ?)';
  
  // The params array is now shorter and matches the SQL query.
  const params = [id, censoredText, commentDate, status, parentId];

  con.run(sql, params, function (err) {
    if (err) {
      // If the error still happens, this line is the most important for debugging.
      console.error('DATABASE ERROR while adding comment:', err);
      return res.status(500).json({ success: false, message: 'Could not post comment due to a server error.' });
    }
    
    res.status(201).json({
      success: true,
      message: containsProfanity
        ? 'Comment added but held for review.'
        : 'Comment added successfully!',
    });
  });
});

// CONTACTS
router.get('/Contact', function (req, res) {
  res.render('contact');
});

module.exports = router;