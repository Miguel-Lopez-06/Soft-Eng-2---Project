var express = require('express');
var router = express.Router();
var con = require('../config/db');

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
      // Add a flag to each announcement to indicate if it has flagged comments
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
router.post('/anncAdd', function(req, res){
  const { title, description, mainImg, galleryImgs } = req.body;

  con.run('INSERT INTO announcement (AdminID, Title, Description, Image, DatePosted) VALUES(?, ?, ?, ?, ?)', [1, title, description, mainImg, new Date().toISOString()], function (err){
    if(err){
      console.error('Error inserting announcement', err);
      return res.status(500).json({ success: false, message: 'Error inserting announcement' });
    }
    
    const announcementId = this.lastID;

    for(let i = 0; i < 20; i++){
      con.run('INSERT INTO `gallery images` (AnnouncementID, Pos, ImagePath) VALUES(?, ?, ?)', [announcementId, i, galleryImgs[i]], (err) => {
        if(err){
          console.error('Error inserting gallery image', err);
          return res.status(500).json({ success: false, message: 'Error inserting gallery image' });
        }
      });
    }
    res.status(200).json({ success: true, message: 'Records successfully added!' });
  });
});
router.post('/anncUpdate', function(req, res){
  const { id, title, description, mainImg, galleryImgs } = req.body;

  con.run('UPDATE announcement SET AdminID = ?, Title = ?, Description = ?, Image = ? WHERE AnnouncementID = ?', [1, title, description, mainImg, id], (err, row) => {
    if(err){
      console.error('Error updating announcement', err);
      return res.status(500).json({ success: false, message: 'Error updating announcement' });
    }
  });
  for(let i = 0; i < 20; i++){
    con.run('UPDATE `gallery images` SET ImagePath = ? WHERE Pos = ? AND AnnouncementID = ?', [galleryImgs[i], i, id], (err, row) => {
      if(err){
        console.error('Error updating gallery image', err);
        return res.status(500).json({ success: false, message: 'Error updating gallery image' });
      }
    });
  }
  res.status(200).json({ success: true, message: 'Records successfully updated!' });
});
router.post('/anncDelete', function(req, res){
  const { id } = req.body;

  con.run('DELETE FROM `gallery images` WHERE AnnouncementID = ?', id, (err, row) => {
    if(err){
      console.error('Error deleting gallery images', err);
      return res.status(500).json({ success: false, message: 'Error deleting gallery images' });
    }
  });
  con.run('DELETE FROM comments WHERE AnnouncementID = ?', id, (err, row) => {
    if(err){
      console.error('Error deleting comments', err);
      return res.status(500).json({ success: false, message: 'Error deleting comments' });
    }
  });
  con.run('DELETE FROM announcement WHERE AnnouncementID = ?', id, (err, row) => {
    if(err){
      console.error('Error deleting announcement', err);
      return res.status(500).json({ success: false, message: 'Error deleting announcement' });
    }
  });
  res.status(200).json({ success: true, message: 'Records successfully deleted!' });
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
router.post('/councilAdd', function(req, res){
  const { image, firstName, mInitial, lastName, position } = req.body;

  con.run('INSERT INTO `council members` (FirstName, MiddleInitial, LastName, Position, Image) VALUES(?, ?, ?, ?, ?)', [firstName, mInitial, lastName, position, image], (err, row) => {
    if(err){
      console.error('Error inserting council member', err);
      return res.status(500).json({ success: false, message: 'Error inserting council member' });
    }
  });
  res.status(200).json({ success: true, message: 'Record successfully inserted!' });
});
router.post('/councilUpdate', function(req, res){
  const { id, image, firstName, mInitial, lastName, position } = req.body;

  con.run('UPDATE `council members` SET FirstName = ?, MiddleInitial = ?, LastName = ?, Position = ?, Image = ? WHERE CouncilID = ?', [firstName, mInitial, lastName, position, image, id], (err, row) => {
    if(err){
      console.error('Error updating council member', err);
      return res.status(500).json({ success: false, message: 'Error updating council member' });
    }
  });
  res.status(200).json({ success: true, message: 'Records successfully updated!' });
});
router.post('/councilDelete', function(req, res){
  var { id } = req.body;

  con.run('DELETE FROM `council members` WHERE CouncilID = ?', id, (err, row) => {
    if(err){
      console.error('Error deleting council member', err);
      return res.status(500).json({ success: false, message: 'Error deleting council member' });
    }
  });
  res.status(200).json({ success: true, message: 'Records successfully deleted!' });
});

// Fetch flagged comments
router.get('/flaggedComments', (req, res) => {
  con.all('SELECT * FROM comments WHERE Status = ?', ['flagged'], (err, rows) => {
    if (err) {
      console.error('Error fetching flagged comments', err);
      return res.status(500).json({ success: false, message: 'Error fetching flagged comments' });
    }
    res.status(200).json({ success: true, flaggedComments: rows });
  });
});

// Approve a flagged comment
router.post('/approveComment', (req, res) => {
  const { commentId } = req.body;
  con.run('UPDATE comments SET Status = ? WHERE CommentID = ?', ['approved', commentId], (err) => {
    if (err) {
      console.error('Error approving comment', err);
      return res.status(500).json({ success: false, message: 'Error approving comment' });
    }
    res.status(200).json({ success: true, message: 'Comment approved!' });
  });
});

// Delete a flagged comment
router.post('/deleteComment', (req, res) => {
  const { commentId } = req.body;
  con.run('DELETE FROM comments WHERE CommentID = ?', [commentId], (err) => {
    if (err) {
      console.error('Error deleting comment', err);
      return res.status(500).json({ success: false, message: 'Error deleting comment' });
    }
    res.status(200).json({ success: true, message: 'Comment deleted!' });
  });
});

module.exports = router;