const express = require('express');
const routes = require('./routes');
const path = require('path');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');

// importar las variables 

require('dotenv').config({path: 'variables.env'});
// helpers con algunas funciones
const helpers = require('./helpers');

// Crear la conexión a la BD
const db = require('./config/db');

// Importar el modelo
require('./models/Proyectos');
require('./models/Tareas');
require('./models/Usuarios');

db.sync()
    .then(() => console.log('Conectado al servidor'))
    .catch(error => console.log(error));

// crear una app de express
const app = express();

// Habilitar bodyParser para leer datos del formulario
app.use(bodyParser.urlencoded({extended: true}));

// Donde cargar los archivos estáticos
app.use(express.static('public'));

// Habilitar Pug (Es un template engine para las vistas)
app.set('view engine', 'pug');

// Añadir la carpeta de las vistas
app.set('views', path.join(__dirname, './views'));

// agregar flash messages 
app.use(flash());

app.use(cookieParser());

// sesiones nos permiten navegar entre distintas páginas sin volvernos a acutenticar
app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

// Pasar vardump a la aplicación
app.use((req, res, next) => {    
    res.locals.vardump = helpers.vardump;
    res.locals.mensajes = req.flash();
    res.locals.usuario = {...req.user} || null;        
    next();
})

// Aprendiendo Middleware
// app.use((req, res, next) => {
//     console.log('Yo soy middleware');
//     next();
// })



app.use('/', routes());

// Servidor y puerto
const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000;


app.listen(port, host, () => {
    console.log('El servidor está LISTO!');
});