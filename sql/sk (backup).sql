DROP TABLE `gallery images`;
DROP TABLE comments;
DROP TABLE announcement;
DROP TABLE admin;
DROP TABLE `council members`;
CREATE TABLE IF NOT EXISTS admin (
    AdminID INTEGER,
    FirstName VARCHAR(45) NOT NULL,
    LastName VARCHAR(45) NOT NULL,
    Username VARCHAR(45) NOT NULL,
    Email VARCHAR(60) NOT NULL,
    Password VARCHAR(45) NOT NULL,
    PRIMARY KEY (AdminID)
);
CREATE TABLE IF NOT EXISTS announcement (
    AnnouncementID INTEGER,
    AdminID INTEGER NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description LONGTEXT,
    Image VARCHAR(255) NOT NULL,
    DatePosted DATETIME NOT NULL,
    PRIMARY KEY (AnnouncementID),
    FOREIGN KEY (AdminID) REFERENCES admin(AdminID)
);
CREATE TABLE IF NOT EXISTS `gallery images` (
    ImageID INTEGER,
    AnnouncementID INTEGER NOT NULL,
    Pos INTEGER NOT NULL,
    ImagePath VARCHAR(255),
    PRIMARY KEY (ImageID),
    FOREIGN KEY (AnnouncementID) REFERENCES announcement(AnnouncementID)
);
CREATE TABLE IF NOT EXISTS comments (
    CommentID INTEGER PRIMARY KEY AUTOINCREMENT,
    AnnouncementID INTEGER NOT NULL,
    Text LONGTEXT NOT NULL,
    CommentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status TEXT CHECK(Status IN ('approved', 'flagged')) DEFAULT 'approved',
    FOREIGN KEY (AnnouncementID) REFERENCES announcement(AnnouncementID)
);
CREATE TABLE IF NOT EXISTS `council members` (
    CouncilID INTEGER,
    FirstName VARCHAR(45) NOT NULL,
    MiddleInitial VARCHAR(45),
    LastName VARCHAR(45) NOT NULL,
    Position TEXT CHECK(Position IN ('SK Chairman', 'SK Treasurer', 'SK Secretary', 'SK Councilor')) NOT NULL,
    Image VARCHAR(255) NOT NULL,
    PRIMARY KEY (CouncilID)
);

--INSERT INTO admin (FirstName, LastName, Username, Email, Password) VALUES("last", "first", "bim", "@fafe", "qwerty");
--UPDATE admin SET FirstName = "", LastName = "", Username = "", Email = "", Password = "" WHERE AdminID = ;
--DELETE FROM admin WHERE AdminID = ;

--INSERT INTO announcement (AdminID, Title, Description, Image, DatePosted) VALUES(, "", "", "", "");
--UPDATE announcement SET AdminID = , Title = "", Description = "" WHERE AnnouncementID = ;
--DELETE FROM announcement WHERE AnnouncementID = ;

--INSERT INTO `gallery images` (AnnouncementID, Pos, ImagePath) VALUES(, , "");
--UPDATE `gallery images` SET ImagePath = "" WHERE Pos =  AND AnnouncementID = ;
--DELETE FROM images WHERE AnnouncementID = ;

--INSERT INTO comments (AnnouncementID, Text, CommentDate) VALUES(, "", "");
--DELETE FROM comments WHERE AnnouncementID = ;

--INSERT INTO `council members` (FirstName, MiddleInitial, LastName, Position, Image) VALUES("", "", "", "", "");
--UPDATE `council members` SET FirstName = , MiddleInitial = , LastName = , Position = , Image =  WHERE CouncilID = ;
--DELETE FROM `council members` WHERE AnnouncementID = ;

SELECT * FROM `gallery images`;
SELECT * FROM comments;
SELECT * FROM announcement;
SELECT * FROM admin;
SELECT * FROM `council members`;