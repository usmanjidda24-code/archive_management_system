const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getDashboard = async (req, res) => {
    try {
        const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
        const [[{ total_categories }]] = await db.query('SELECT COUNT(*) as total_categories FROM categories');
        const [[{ total_departments }]] = await db.query('SELECT COUNT(*) as total_departments FROM departments');
        const [[{ total_archives }]] = await db.query('SELECT COUNT(*) as total_archives FROM archives');
        const [recent_logs] = await db.query('SELECT activity_logs.*, users.full_name as user_name FROM activity_logs LEFT JOIN users ON activity_logs.user_id = users.id ORDER BY created_at DESC LIMIT 5');

        res.render('admin/dashboard', {
            total_users, total_categories, total_departments, total_archives, recent_logs
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT users.*, departments.name as dept_name FROM users LEFT JOIN departments ON users.department_id = departments.id ORDER BY users.id DESC');
        const [departments] = await db.query('SELECT * FROM departments');
        res.render('admin/users', { users, departments });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.addUser = async (req, res) => {
    const { full_name, email, password, role, department_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (full_name, email, password_hash, role, department_id) VALUES (?, ?, ?, ?, ?)', [full_name, email, hashedPassword, role, department_id || null]);
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, `Created user: ${email}`]);
        req.flash('success', 'User added successfully');
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error adding user. Email might be duplicate.');
        res.redirect('/admin/users');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (parseInt(id) === req.session.userId) {
            req.flash('error', 'Cannot delete yourself!');
            return res.redirect('/admin/users');
        }
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, `Deleted user ID: ${id}`]);
        req.flash('success', 'User deleted successfully');
        res.redirect('/admin/users');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error deleting user');
        res.redirect('/admin/users');
    }
};

exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories');
        res.render('admin/categories', { categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, `Added category: ${name}`]);
        req.flash('success', 'Category added');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error adding category');
        res.redirect('/admin/categories');
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, `Deleted category ID: ${id}`]);
        req.flash('success', 'Category deleted');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error deleting category');
        res.redirect('/admin/categories');
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const [departments] = await db.query('SELECT * FROM departments');
        res.render('admin/departments', { departments });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.addDepartment = async (req, res) => {
    try {
        const { name } = req.body;
        await db.query('INSERT INTO departments (name) VALUES (?)', [name]);
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, `Added department: ${name}`]);
        req.flash('success', 'Department added');
        res.redirect('/admin/departments');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error adding department');
        res.redirect('/admin/departments');
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM departments WHERE id = ?', [id]);
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, `Deleted department ID: ${id}`]);
        req.flash('success', 'Department deleted');
        res.redirect('/admin/departments');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error deleting department');
        res.redirect('/admin/departments');
    }
};

exports.getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        const [[{ total_logs }]] = await db.query('SELECT COUNT(*) as total_logs FROM activity_logs');
        const [logs] = await db.query('SELECT activity_logs.*, users.full_name as user_name FROM activity_logs LEFT JOIN users ON activity_logs.user_id = users.id ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
        
        const totalPages = Math.ceil(total_logs / limit);
        
        res.render('admin/logs', { logs, page, totalPages });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
