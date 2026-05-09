const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    try {
        console.log('Connecting to MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('Creating database if not exists...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);

        console.log('Creating tables...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(150) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'staff') DEFAULT 'staff',
                department_id INT,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS archives (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                file_name VARCHAR(255) NOT NULL, 
                file_path VARCHAR(255) NOT NULL, 
                file_type VARCHAR(50) NOT NULL,  
                uploader_id INT NOT NULL,
                category_id INT,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Inserting default data...');
        // Insert default categories
        await connection.query(`INSERT IGNORE INTO categories (id, name) VALUES (1, 'Official Memo'), (2, 'Financial Report'), (3, 'General File')`);
        
        // Setup default admin
        const bcrypt = require('bcryptjs');
        const defaultAdminPassword = await bcrypt.hash('admin123', 10);
        
        // Using INSERT IGNORE to prevent duplicate errors if run multiple times
        await connection.query(`
            INSERT IGNORE INTO users (id, full_name, email, password_hash, role) 
            VALUES (1, 'System Admin', 'admin@archive.com', ?, 'admin')
        `, [defaultAdminPassword]);

        console.log('Database setup completed successfully.');
        console.log('Default Admin Login: admin@archive.com / admin123');
        process.exit(0);
    } catch (error) {
        console.error('Error setting up database. Make sure MySQL (XAMPP) is running!');
        console.error(error.message);
        process.exit(1);
    }
}

setupDatabase();
