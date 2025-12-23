const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const { typeDefs, resolvers } = require('./graphql/schema');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST API Routes
app.use('/api/auth', authRoutes);

// Base Route
app.get('/', (req, res) => {
    res.send('Mecca Auth Service is running');
});

// GraphQL Context
const context = ({ req }) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            return { user };
        } catch (err) {
            return {};
        }
    }

    return {};
};

// Start Server
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully (Mecca Auth Service - Mecca_auth_db).');

        // Sync database
        await sequelize.sync({ alter: false });
        console.log('Database synchronized.');

        // Apollo Server Setup
        const apolloServer = new ApolloServer({
            typeDefs,
            resolvers,
            context,
            introspection: true,
            playground: true
        });

        await apolloServer.start();
        apolloServer.applyMiddleware({ app, path: '/graphql' });

        // Swagger Documentation
        const swaggerUi = require('swagger-ui-express');
        const swaggerSpecs = require('./config/swagger');
        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

        app.listen(PORT, () => {
            console.log(`Mecca Auth Service running on port ${PORT}`);
            console.log(`REST API: http://localhost:${PORT}/api/auth`);
            console.log(`GraphQL: http://localhost:${PORT}/graphql`);
            console.log(`Swagger Docs: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
