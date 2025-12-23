/**
 * Sync Mecca_student_db tables using Sequelize
 */

const { sequelize } = require('../Mecca-student-service/models');

async function syncDatabase() {
    try {
        console.log('🔄 Syncing Mecca_student_db...');

        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Sync all models (create tables)
        await sequelize.sync({ force: false, alter: true });
        console.log('✅ All tables created/updated in Mecca_student_db');

        console.log('\n📋 Tables created:');
        console.log('   - Students');
        console.log('   - Classes');
        console.log('   - Subjects');
        console.log('   - Teachers');
        console.log('   - Schedules');
        console.log('   - Attendances');
        console.log('   - Grades');
        console.log('   - Fees');
        console.log('   - Bills');
        console.log('   - LibraryBooks');
        console.log('   - LibraryLoans');

        await sequelize.close();
        console.log('\n✅ Sync completed successfully!');

    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

syncDatabase();
