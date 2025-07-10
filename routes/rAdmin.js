var express = require('express');
var router = express.Router();
var con = require('../config/db');
var multer = require('multer');
var path = require('path');

// --- Multer Configuration ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/announcements/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // This check now includes video mimetypes
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'), false);
        }
    }
});
// --- End Multer Configuration ---

// --- Middleware to log admin actions ---
function logAdminAction(req, res, next) {
    if (req.session.AdminID) {
        const action = `${req.method} ${req.originalUrl}`;
        con.run('INSERT INTO admin_logs (AdminID, Action) VALUES (?, ?)', [req.session.AdminID, action], (err) => {
            if (err) {
                console.error('Error logging admin action:', err);
            }
        });
    }
    next();
}
// --- End Middleware ---


const loadData = (tableNames) => {
  const selectQuery = tableNames.map((tableName) => {
    return new Promise((resolve, reject) => {
      con.all(`SELECT * FROM \`${tableName}\``, function(err, rows){
        if(err){
          console.error(`Cannot load ${tableName} data`, err);
          reject({err, tableName});
        }
        else{
          resolve(rows);
        }
      });
    });
  });

  return Promise.all(selectQuery);
}

router.get('/login', function(req, res){
  if(req.session.AdminID){
    res.redirect('/admin')
  }
  else{
    res.render('login');
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if(!req.session.AdminID){
    con.all('SELECT * FROM admin WHERE Username = ?', [username], async (err, user) => {
      if(err){
        console.error('Cannot load admin data', err);
        return res.status(500).json({ success: false, message: 'Cannot load admin data' });
      }
      
      if(user.length && password === user[0].Password){
        req.session.AdminID = user[0].AdminID;
        const loginAction = `Login: User '${username}' successfully logged in.`;
        con.run('INSERT INTO admin_logs (AdminID, Action) VALUES (?, ?)', [user[0].AdminID, loginAction], (logErr) => {
            if (logErr) console.error('Error logging login action:', logErr);
        });
        return res.status(200).json({ success: true, message: 'Login successful' });
      }
      else{
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
    });
  }
  else{
    return res.status(401).json({ success: false, message: 'An account has already been logged in.' });
  }
});

router.get('/', (req, res) => {
  if(req.session.AdminID){
    res.render('admin');
  }
  else{
    res.redirect('/admin/login');
  }
});

// ANNOUNCEMENT
router.get('/anncGet', function (req, res) {
  loadData(['announcement', 'gallery images', 'comments'])
    .then(([announcements, galImages, comments]) => {
      const announcementsWithFlagged = announcements.map((announcement) => {
        const hasFlaggedComments = comments.some(
          (comment) =>
            comment.AnnouncementID === announcement.AnnouncementID &&
            comment.Status === 'flagged'
        );
        return { ...announcement, hasFlaggedComments };
      });

      res.status(200).json({
        success: true,
        message: 'All data successfully loaded!',
        announcements: announcementsWithFlagged || [],
        galImages: galImages || [],
        comments: comments || [],
      });
    })
    .catch(({ err, tableName }) => {
      console.error(`Cannot load ${tableName}`, err);
      res.status(500).json({ success: false, message: `Cannot load ${tableName}` });
    });
});

router.post('/anncAdd', logAdminAction, upload.fields([{ name: 'mainImg', maxCount: 1 }, { name: 'galleryImgs', maxCount: 20 }]), (req, res) => {
  if (!req.session.AdminID) return res.status(401).json({ success: false, message: 'Session expired' });

  const { title, description } = req.body;
  const mainImgPath = req.files.mainImg ? '/images/announcements/' + req.files.mainImg[0].filename : null;
  const galleryImgPaths = req.files.galleryImgs ? req.files.galleryImgs.map(f => '/images/announcements/' + f.filename) : [];

  con.run('INSERT INTO announcement (AdminID, Title, Description, Image, DatePosted) VALUES (?, ?, ?, ?, ?)', 
    [req.session.AdminID, title, description, mainImgPath, new Date().toISOString()], function (err) {
      if (err) return res.status(500).json({ success: false, message: 'Error inserting announcement' });

      const anncID = this.lastID;
      const galStmt = con.prepare('INSERT INTO `gallery images` (AnnouncementID, Pos, ImagePath) VALUES (?, ?, ?)');
      galleryImgPaths.forEach((path, i) => galStmt.run(anncID, i, path));
      galStmt.finalize();

      res.status(200).json({ success: true, message: 'Announcement added' });
    });
});

router.post('/anncUpdate', logAdminAction, upload.fields([{ name: 'mainImg', maxCount: 1 }, { name: 'galleryImgs', maxCount: 20 }]), async (req, res) => {
  if (!req.session.AdminID) {
    return res.status(401).json({ success: false, message: 'Session expired' });
  }

  const { id, title, description, existingMainImg } = req.body;

  // Helper function to promisify database calls
  const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      con.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve(this);
      });
    });
  };

  try {
    // 1. Prepare file paths
    let existingImgs = [];
    if (req.body.existingGalleryImgs) {
      existingImgs = Array.isArray(req.body.existingGalleryImgs) ? req.body.existingGalleryImgs : [req.body.existingGalleryImgs];
    }

    const newMainImgPath = req.files.mainImg ? '/images/announcements/' + req.files.mainImg[0].filename : null;
    const newGalleryImgPaths = req.files.galleryImgs ? req.files.galleryImgs.map(f => '/images/announcements/' + f.filename) : [];
    
    const finalMainImgPath = newMainImgPath || existingMainImg;
    const allGalleryPaths = [...newGalleryImgPaths, ...existingImgs];

    // 2. Start database transaction
    await runQuery('BEGIN TRANSACTION;');

    // 3. Update the main announcement details
    await runQuery(
      'UPDATE announcement SET Title = ?, Description = ?, Image = ? WHERE AnnouncementID = ?',
      [title, description, finalMainImgPath, id]
    );

    // 4. Delete all old gallery images for this announcement
    await runQuery('DELETE FROM `gallery images` WHERE AnnouncementID = ?', [id]);

    // 5. Insert all current gallery images (new and existing)
    if (allGalleryPaths.length > 0) {
      const insertStmt = con.prepare('INSERT INTO `gallery images` (AnnouncementID, Pos, ImagePath) VALUES (?, ?, ?)');
      for (let i = 0; i < allGalleryPaths.length; i++) {
        await runQuery.call(insertStmt, allGalleryPaths[i], [id, i, allGalleryPaths[i]]);
      }
      insertStmt.finalize();
    }

    // 6. Commit transaction
    await runQuery('COMMIT;');

    res.status(200).json({ success: true, message: 'Announcement updated successfully' });

  } catch (err) {
    // If any step fails, roll back the transaction
    await runQuery('ROLLBACK;');
    console.error("Transaction failed:", err.message);
    res.status(500).json({ success: false, message: 'An internal server error occurred. The update was not saved.' });
  }
});


router.post('/anncDelete', logAdminAction, function(req, res){
  if (!req.session.AdminID) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }

  const { id } = req.body;
  
  con.serialize(() => {
    con.run('DELETE FROM `gallery images` WHERE AnnouncementID = ?', id, (err) => {
      if(err) console.error('Error deleting gallery images', err);
    });
    con.run('DELETE FROM comments WHERE AnnouncementID = ?', id, (err) => {
      if(err) console.error('Error deleting comments', err);
    });
    con.run('DELETE FROM announcement WHERE AnnouncementID = ?', id, (err) => {
      if(err){
        console.error('Error deleting announcement', err);
        return res.status(500).json({ success: false, message: 'Error deleting announcement' });
      }
      res.status(200).json({ success: true, message: 'Records successfully deleted!' });
    });
  });
});

// COUNCIL MEMBERS
router.get('/councilGet', function(req, res){
  loadData(['council members'])
  .then(([councilMembers]) => {
    res.status(200).json({
      success: true,
      message: 'Records successfully loaded!',
      councilMembers: councilMembers || [],
    });
  })
  .catch(({err, tableName}) => {
    console.error('Cannot load council members data', err);
    res.status(500).json({ success: false, message: 'Cannot load council members data' });
  });
});

router.post('/councilAdd', logAdminAction, upload.single('image'), function(req, res){
  const { firstName, mInitial, lastName, position } = req.body;
  
  // Get the file path from multer's req.file object
  const imagePath = req.file ? '/images/council members/' + req.file.filename : null;

  if (!imagePath) {
    return res.status(400).json({ success: false, message: 'Council member photo is required.' });
  }

  con.run('INSERT INTO `council members` (FirstName, MiddleInitial, LastName, Position, Image) VALUES(?, ?, ?, ?, ?)', 
    [firstName, mInitial, lastName, position, imagePath], (err) => {
    if(err){
      console.error('Error inserting council member', err);
      return res.status(500).json({ success: false, message: 'Error inserting council member' });
    }
    res.status(200).json({ success: true, message: 'Record successfully inserted!' });
  });
});

router.post('/councilUpdate', logAdminAction, upload.single('image'), function(req, res){
  const { id, firstName, mInitial, lastName, position } = req.body;

  // If a new file is uploaded, use its path. Otherwise, keep the existing path.
  const imagePath = req.file ? '/images/council members/' + req.file.filename : req.body.existingImage;

  con.run('UPDATE `council members` SET FirstName = ?, MiddleInitial = ?, LastName = ?, Position = ?, Image = ? WHERE CouncilID = ?', 
    [firstName, mInitial, lastName, position, imagePath, id], (err) => {
    if(err){
      console.error('Error updating council member', err);
      return res.status(500).json({ success: false, message: 'Error updating council member' });
    }
    res.status(200).json({ success: true, message: 'Records successfully updated!' });
  });
});

router.post('/councilDelete', logAdminAction, function(req, res){
  var { id } = req.body;

  con.run('DELETE FROM `council members` WHERE CouncilID = ?', id, (err) => {
    if(err){
      console.error('Error deleting council member', err);
      return res.status(500).json({ success: false, message: 'Error deleting council member' });
    }
    res.status(200).json({ success: true, message: 'Records successfully deleted!' });
  });
});

// COMMENTS
router.get('/flaggedComments', (req, res) => {
  con.all('SELECT * FROM comments WHERE Status = ?', ['flagged'], (err, rows) => {
    if (err) {
      console.error('Error fetching flagged comments', err);
      return res.status(500).json({ success: false, message: 'Error fetching flagged comments' });
    }
    res.status(200).json({ success: true, flaggedComments: rows });
  });
});

router.post('/approveComment', logAdminAction, (req, res) => {
  const { commentId } = req.body;
  con.run('UPDATE comments SET Status = ? WHERE CommentID = ?', ['approved', commentId], (err) => {
    if (err) {
      console.error('Error approving comment', err);
      return res.status(500).json({ success: false, message: 'Error approving comment' });
    }
    res.status(200).json({ success: true, message: 'Comment approved!' });
  });
});

router.post('/deleteComment', logAdminAction, (req, res) => {
  const { commentId } = req.body;
  con.run('DELETE FROM comments WHERE CommentID = ?', [commentId], (err) => {
    if (err) {
      console.error('Error deleting comment', err);
      return res.status(500).json({ success: false, message: 'Error deleting comment' });
    }
    res.status(200).json({ success: true, message: 'Comment deleted!' });
  });
});

router.get('/logs', function(req, res) {
    // Security check to ensure an admin is logged in
    // FIX: Changed from req.session.adminId to req.session.AdminID
    if (!req.session.AdminID) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const sql = "SELECT LogID, AdminID, Action, Timestamp FROM admin_logs ORDER BY Timestamp DESC";

    con.all(sql, [], (err, logs) => {
        if (err) {
            console.error("Error fetching admin logs:", err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        
        // This route now sends ONLY the log data as a JSON response
        res.status(200).json({ success: true, logs: logs });
    });
});

module.exports = router;