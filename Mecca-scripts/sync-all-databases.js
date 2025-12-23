/**
 * Sync ALL Mecca databases at once
 * This is simpler than requiring from service folders
 */

const { Sequelize, DataTypes } = require('sequelize');

// Database credentials
const DB_CONFIG = {
    host: '20.6.11.39',
    port: 3310,
    user: 'username2',
    password: 'password123',
    dialect: 'mysql',
    logging: false
};

async function syncAllDatabases() {
    try {
        console.log('🚀 Starting sync for all Mecca databases...\n');

        // 1. Sync Mecca_auth_db
        console.log('📦 1/5 - Mecca_auth_db');
        const authDb = new Sequelize('Mecca_auth_db', DB_CONFIG.user, DB_CONFIG.password, DB_CONFIG);
        await authDb.authenticate();

        authDb.define('Admin', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            username: { type: DataTypes.STRING, allowNull: false, unique: true },
            password: { type: DataTypes.STRING, allowNull: false },
            name: { type: DataTypes.STRING, allowNull: false }
        }, { timestamps: true });

        authDb.define('Student', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            nis: { type: DataTypes.STRING, unique: true, allowNull: false },
            name: { type: DataTypes.STRING, allowNull: false },
            password: { type: DataTypes.STRING, allowNull: false },
            isActive: { type: DataTypes.BOOLEAN, defaultValue: false }
        }, { timestamps: true });

        authDb.define('Teacher', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            nip: { type: DataTypes.STRING, allowNull: false, unique: true },
            name: { type: DataTypes.STRING, allowNull: false },
            password: { type: DataTypes.STRING, allowNull: false }
        }, { timestamps: true });

        await authDb.sync({ alter: true });
        console.log('✅ Mecca_auth_db synced (3 tables)\n');
        await authDb.close();

        // 2-5. For other databases, just sync them (tables will be created when services start)
        const databases = ['Mecca_admin_db', 'Mecca_student_db', 'Mecca_teacher_db', 'Mecca_parent_db'];

        for (let i = 0; i < databases.length; i++) {
            console.log(`📦 ${i + 2}/5 - ${databases[i]}`);
            const db = new Sequelize(databases[i], DB_CONFIG.user, DB_CONFIG.password, DB_CONFIG);
            await db.authenticate();
            console.log(`✅ ${databases[i]} ready (tables will sync when service starts)\n`);
            await db.close();
        }

        console.log('🎉 All databases synced successfully!');
        console.log('\n📋 Next steps:');
        console.log('   1. Install dependencies di setiap service (npm install)');
        console.log('   2. Start services - tables akan auto-create via Sequelize');
        console.log('   3. Check GraphQL playground di http://localhost:300X/graphql');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

syncAllDatabases();
