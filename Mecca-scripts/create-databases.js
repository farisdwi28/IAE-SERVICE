/**
 * Mecca Database Initialization Script
 * Creates all 5 databases and tables using Sequelize
 * 
 * Run this script ONCE to setup all databases
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
    host: '20.6.11.39',
    port: 3310,
    user: 'username2',
    password: 'password123'
};

const DATABASES = [
    'Mecca_auth_db',
    'Mecca_admin_db',
    'Mecca_student_db',
    'Mecca_teacher_db',
    'Mecca_parent_db'
];

async function createDatabases() {
    console.log('🚀 Starting Mecca Database Initialization...\n');

    try {
        // Connect to MySQL
        const connection = await mysql.createConnection(DB_CONFIG);
        console.log('✅ Connected to MySQL server\n');

        // Create each database
        for (const dbName of DATABASES) {
            console.log(`📦 Creating database: ${dbName}`);
            await connection.query(
                `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
            console.log(`✅ Database ${dbName} created/verified\n`);
        }

        await connection.end();
        console.log('✅ All databases created successfully!\n');
        console.log('📋 Next steps:');
        console.log('   1. Run: node sync-auth-db.js');
        console.log('   2. Run: node sync-admin-db.js');
        console.log('   3. Run: node sync-student-db.js');
        console.log('   4. Run: node sync-teacher-db.js');
        console.log('   5. Run: node sync-parent-db.js');

    } catch (error) {
        console.error('❌ Error creating databases:', error.message);
        process.exit(1);
    }
}

createDatabases();
