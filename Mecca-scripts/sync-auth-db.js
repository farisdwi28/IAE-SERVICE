/**
 * Sync Mecca_auth_db tables using Sequelize
 */

const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('Mecca_auth_db', 'username2', 'password123', {
    host: '20.6.11.39',
    port: 3310,
    dialect: 'mysql',
    logging: console.log
});

// Define models inline (tidak depend pada service folders)
const Admin = sequelize.define('Admin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true
});

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nis: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true
});

const Teacher = sequelize.define('Teacher', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nip: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true
});

async function syncDatabase() {
    try {
        console.log('🔄 Syncing Mecca_auth_db...');

        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Sync all models (create tables)
        await sequelize.sync({ force: false, alter: true });
        console.log('✅ All tables created/updated in Mecca_auth_db');

        console.log('\n📋 Tables created:');
        console.log('   - Admins');
        console.log('   - Students');
        console.log('   - Teachers');

        await sequelize.close();
        console.log('\n✅ Sync completed successfully!');

    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

syncDatabase();
