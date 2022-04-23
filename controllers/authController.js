const passport = require('passport');
const Usuarios = require('../models/Usuarios');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const moment = require('moment');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos cambios son obligatorios'
});

// Función para revisar si el usuario esta logueado o no
exports.usuarioAutenticado = (req, res, next) => {

    // si el usuario está autenticado, adelante
    if(req.isAuthenticated()){
        return next();
    }
    // si no esta autenticado, redirigir al formulario
    return res.redirect('/iniciar-sesion');
}

// Función para cerrar sesión
exports.cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/iniciar-sesion'); // al cerrar sesión nos lleva al login
    })
}

// genera un token si el usuario es válido
exports.enviarToken = async (req, res) => {
    // verificar que el usuario exista
    const {email} = req.body
    const usuario = await Usuarios.findOne({where: {email}})

    // Si no existe el usuario
    if(!usuario) {
        req.flash('error', 'No existe esa cuenta');
        res.redirect('/restablecer');
    }

    // usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex');
    var fecha=new Date()
    fecha=fecha.setHours(fecha.getHours()-4)
    console.log(fecha);
    usuario.expiracion = moment(fecha).format('YYYY-MM-DD HH:mm:ss') ;

    console.log(usuario.expiracion);
    // guardarlos en la base de datos
    await usuario.save();

    // url de reset
    const resetUrl = `http://${req.headers.host}/restablecer/${usuario.token}`;

    // Enviar el correo con el token
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'restablecer-password'
    });

    // terminar
    res.flash('correcto', 'Se ha enviado un mensaje a tu correo.');
    res.redirect('/iniciar-sesion');
}



exports.validarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token
        }
    });

    // Si no encuentra el usuario
    if(!usuario){
        req.flash('error', 'No válido');
        res.redirect('/restablecer');
    }

    // Formulario para generar el password
    res.render('resetPassword', {
        nombrePagina : 'Restablecer contraseña'
    });

    console.log(usuario);
}

// Cambiar el password por el nuevo
exports.actualizarPassword = async (req, res) => {

    // Verifica el token válido pero también la fecha de expiración
    var fecha=new Date()
    fecha=fecha.setHours(fecha.getHours()-5)
    //fecha = moment(fecha).format('YYYY-MM-DD HH:mm:ss') ;
    console.log("fecha actual es: "+fecha)
    console.log("Busca usuario...")
    const usuario = await Usuarios.findOne({
        where: {
            token: req.params.token,
            expiracion: {
                [Op.gte] : fecha
            }
        }
    });

    // verificamos si el usuario existe
    if(!usuario) {
        req.flash('error', 'No hay usuario');
        res.redirect('/restablecer');
    }

    // hashear el nueuvo password
    console.log("Hasheando password...")
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    usuario.token = null;
    usuario.expiracion = null;
    console.log("token y expiracion se pasaran como nulos...")

    // guardamos el nuevo password
    await usuario.save();
    console.log("Usuario actualizado")

    req.flash('correcto', 'Tu contraseña se ha actualizado correctamente!');
    res.redirect('/iniciar-sesion');
    
}