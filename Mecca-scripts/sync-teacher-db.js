/**
 * Sync Mecca_teacher_db tables using Sequelize
 */

const { sequelize } = require('../Mecca-teacher-service/models');

async function syncDatabase() {
    try {
        console.log('🔄 Syncing Mecca_teacher_db...');

        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Sync all models (create tables)
        await sequelize.sync({ force: false, alter: true });
        console.log('✅ All tables created/updated in Mecca_teacher_db');

        console.log('\n📋 Tables created:');
        console.log('   - Teachers');
        console.log('   - Students');
        console.log('   - Classes');
        console.log('   - Subjects');
        console.log('   - Schedules');
        console.log('   - Attendances');
        console.log('   - Grades');

        await sequelize.close();
        console.log('\n✅ Sync completed successfully!');

    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

syncDatabase();
