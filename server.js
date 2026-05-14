const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const flash = require('connect-flash');
require('dotenv').config();

const app = express();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware setup
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallbackSessionSecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));
// Flash middleware
app.use(flash());

// Global variable for views
app.use((req, res, next) => {
    res.locals.user = req.session || null;
    res.locals.currentPath = req.path.split('/')[1] || '';
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');
    next();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const archiveRoutes = require('./routes/archiveRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use Routes
app.use('/', authRoutes);
app.use('/', archiveRoutes);
app.use('/admin', adminRoutes);

// Root Route (Landing Page)
app.get('/', (req, res) => {
    res.render('landing', { user: req.session || null, currentPath: 'home' });
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('404');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running smoothly on http://localhost:${PORT}`);
});
