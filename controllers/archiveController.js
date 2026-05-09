const db = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.getDashboard = async (req, res) => {
    try {
        const [[{ total_archives }]] = await db.query('SELECT COUNT(*) as total_archives FROM archives');
        const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
        const [recent_archives] = await db.query(`
            SELECT archives.*, categories.name as cat_name, users.full_name as uploader 
            FROM archives 
            LEFT JOIN categories ON archives.category_id = categories.id 
            LEFT JOIN users ON archives.uploader_id = users.id 
            ORDER BY archives.upload_date DESC LIMIT 5
        `);
        
        res.render('dashboard', {
            user: req.session,
            total_archives,
            total_users,
            recent_archives
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getUploadForm = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories');
        res.render('upload', { categories, user: req.session });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.postUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Upload Failed. Ensure file is a valid type.');
    }

    const { title, category_id } = req.body;
    const { filename, path: filepath, mimetype } = req.file;
    const uploader_id = req.session.userId; 

    try {
        const sql = `INSERT INTO archives (title, file_name, file_path, file_type, uploader_id, category_id) VALUES (?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [title, filename, filepath, mimetype, uploader_id, category_id]);
        
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [uploader_id, `Uploaded document: ${title}`]);
        
        res.redirect('/archives');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getArchivesList = async (req, res) => {
    try {
        const [archives] = await db.query(`
            SELECT archives.*, categories.name as cat_name, users.full_name as uploader 
            FROM archives 
            LEFT JOIN categories ON archives.category_id = categories.id 
            LEFT JOIN users ON archives.uploader_id = users.id 
            ORDER BY archives.upload_date DESC
        `);
        
        const [categories] = await db.query('SELECT * FROM categories');

        res.render('archives', { archives, categories, user: req.session, searchQuery: '' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.searchArchives = async (req, res) => {
    const { q, category_id } = req.query;
    const keyword = `%${q || ''}%`;
    
    try {
        let sql = `
            SELECT archives.*, categories.name as cat_name, users.full_name as uploader 
            FROM archives 
            LEFT JOIN categories ON archives.category_id = categories.id 
            LEFT JOIN users ON archives.uploader_id = users.id 
            WHERE (archives.title LIKE ? OR archives.file_name LIKE ?)
        `;
        let params = [keyword, keyword];
        
        if (category_id && category_id !== '') {
            sql += ` AND archives.category_id = ?`;
            params.push(category_id);
        }

        sql += ` ORDER BY archives.upload_date DESC`;

        const [archives] = await db.query(sql, params);
        const [categories] = await db.query('SELECT * FROM categories');

        res.render('archives', { archives, categories, user: req.session, searchQuery: q });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.downloadArchive = async (req, res) => {
    try {
        const { id } = req.params;
        const [[archive]] = await db.query('SELECT * FROM archives WHERE id = ?', [id]);
        
        if (!archive) return res.status(404).send('File not found in database');

        const fileLocation = path.resolve(archive.file_path);
        
        if (fs.existsSync(fileLocation)) {
            await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, `Downloaded document: ${archive.title}`]);
            res.download(fileLocation, archive.title + path.extname(archive.file_name));
        } else {
            res.status(404).send('Physical file not found on server');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
