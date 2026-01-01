const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const sequelize = require('./config/database');
const adminRoutes = require('./routes/admin');
const syncController = require('./controllers/syncController');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', adminRoutes);

app.post('/api/sync/attendance', syncController.syncAttendanceData);
app.post('/api/sync/grades', syncController.syncGradeData);

// Base Route
app.get('/', (req, res) => {
    res.send('Admin Service is running');
});

const paymentReminder = require('./jobs/paymentReminder');
const libraryReminder = require('./jobs/libraryReminder');
const billGenerator = require('./jobs/billGenerator');

// Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully (Admin Service - Mecca_admin_db).');

        // Sync database tables
        await sequelize.sync({ alter: false });
        console.log('Database tables synchronized.');

        // Initialize Cron Jobs
        paymentReminder.init();
        libraryReminder.init();

        // Swagger Documentation
        const swaggerUi = require('swagger-ui-express');
        const swaggerSpecs = require('./config/swagger');
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

        app.listen(PORT, () => {
            console.log(`Admin Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
