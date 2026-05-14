const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Setup session
        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.fullName = user.full_name;

        // Log the login action
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [user.id, 'Logged in to system']);

        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server Error');
    }
};

exports.logout = async (req, res) => {
    if (req.session.userId) {
        await db.query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [req.session.userId, 'Logged out']);
    }
    req.session.destroy((err) => {
        if (err) console.error('Logout error:', err);
        res.redirect('/login');
    });
};
