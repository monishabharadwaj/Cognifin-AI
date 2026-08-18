const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});

module.exports = {
    PORT: process.env.PORT || 5000,
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
    CORS_ALLOW_ALL: process.env.CORS_ALLOW_ALL === 'true',
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || ''
};