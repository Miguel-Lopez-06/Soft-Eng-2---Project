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
router.get('/Announcement/:id/getComments', function (req, res) {
  const { id } = req.params;

  con.all(
    'SELECT * FROM comments WHERE AnnouncementID = ? ORDER BY CommentDate DESC', // Ensure consistent ordering
    [id],
    function (err, rows) {
      if (err) {
        console.error('Cannot load data', err);
        res.status(500).json({ success: false, message: 'Cannot load data' });
      } else {
        res.status(200).json({ success: true, message: 'Records successfully fetched!', data: rows });
      }
    }
  );
});
router.post('/Announcement/:id/addComment', function (req, res) {
  const { id } = req.params;
  const { text } = req.body;

  console.log('Received comment:', text); // Debugging: Log the received comment

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required.' });
  }

  // Filter profanity
  const { censoredText, containsProfanity } = filterProfanity(text);
  console.log('Censored comment:', censoredText); // Debugging: Log the censored comment

  const commentDate = new Date().toISOString();
  const status = containsProfanity ? 'flagged' : 'approved'; // Flag comment if profanity is detected

  con.run(
    'INSERT INTO comments (AnnouncementID, Text, CommentDate, Status) VALUES (?, ?, ?, ?)',
    [id, censoredText, commentDate, status],
    function (err) {
      if (err) {
        console.error('Error adding comment:', err);
        return res.status(500).json({ success: false, message: 'Sorry, your comment contains profanity.' });
      }
      res.status(200).json({
        success: true,
        message: containsProfanity
          ? 'Comment added but flagged for profanity.'
          : 'Comment added successfully!',
      });
    }
  );
});

// CONTACTS
router.get('/Contact', function (req, res) {
  res.render('contact');
});

module.exports = router;