const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

router.use(isAuthenticated, isAdmin); // Protect all admin routes

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Users Management
router.get('/users', adminController.getUsers);
router.post('/users/add', adminController.addUser);
router.post('/users/delete/:id', adminController.deleteUser);

// Categories Management
router.get('/categories', adminController.getCategories);
router.post('/categories/add', adminController.addCategory);
router.post('/categories/delete/:id', adminController.deleteCategory);

// Departments Management
router.get('/departments', adminController.getDepartments);
router.post('/departments/add', adminController.addDepartment);
router.post('/departments/delete/:id', adminController.deleteDepartment);

// Activity Logs
router.get('/logs', adminController.getLogs);

module.exports = router;
