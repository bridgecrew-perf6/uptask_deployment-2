const Sequelize = require('sequelize');

//importar las variables
require('dotenv').config({path: 'variables.env'});

const db = new Sequelize(
    'test',
    'VentaVinculacion',
    '2524Ad&you_2021',


    // process.env.BD_NOMBRE, 
    // process.env.BD_USER, 
    // process.env.BD_PASS, 
    {
        //host: process.env.BD_HOST,
        host: '51.89.33.89',
        dialect: 'mysql',
        //port: process.env.BD_PORT,
        port: '3306',
        define: {
            timestamps: false
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = db;