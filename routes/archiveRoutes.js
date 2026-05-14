const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(isAuthenticated); // Protect all routes below

router.get('/dashboard', archiveController.getDashboard);
router.get('/archives', archiveController.getArchivesList);
router.get('/archives/upload', archiveController.getUploadForm);
router.post('/archives/upload', (req, res, next) => {
    upload.single('archive_file')(req, res, (err) => {
        if (!err) {
            return next();
        }

        req.flash('error', err.message || 'Upload failed. Please try again.');
        return res.redirect('/archives/upload');
    });
}, archiveController.postUpload);
router.get('/archives/search', archiveController.searchArchives);
router.get('/archives/download/:id', archiveController.downloadArchive);

module.exports = router;
