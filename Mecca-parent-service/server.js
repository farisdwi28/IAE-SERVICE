const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const sequelize = require('./config/database');
const parentRoutes = require('./routes/parent');
const syncController = require('./controllers/syncController');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

app.post('/api/sync/students', syncController.syncStudentData);
app.post('/api/sync/classes', syncController.syncClass);

// Routes
app.use('/api/parent', parentRoutes);

// Base Route
app.get('/', (req, res) => {
    res.send('Parent Service is running');
});

// Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully (Parent Service - Mecca_parent_db).');

        // Sync database tables
        await sequelize.sync({ alter: false });
        console.log('Database tables synchronized.');

        // Swagger Documentation
        const swaggerUi = require('swagger-ui-express');
        const swaggerSpecs = require('./config/swagger');
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

        app.listen(PORT, () => {
            console.log(`Parent Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
