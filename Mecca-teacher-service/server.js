const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const sequelize = require('./config/database');
const teacherRoutes = require('./routes/teacher');
const syncController = require('./controllers/syncController');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/sync/students', syncController.syncStudentData);
app.post('/api/sync/classes', syncController.syncClass);
app.post('/api/sync/teachers', syncController.syncTeacher);
app.post('/api/sync/subjects', syncController.syncSubject);
app.post('/api/sync/schedules', syncController.syncSchedule);

// Routes
app.use('/api/teacher', teacherRoutes);

// Base Route
app.get('/', (req, res) => {
    res.send('Teacher Service is running');
});

// Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully (Teacher Service - Mecca_teacher_db).');

        // Sync database tables
        await sequelize.sync({ alter: false });
        console.log('Database tables synchronized.');

        // Swagger Documentation
        const swaggerUi = require('swagger-ui-express');
        const swaggerSpecs = require('./config/swagger');
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

        app.listen(PORT, () => {
            console.log(`Teacher Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
