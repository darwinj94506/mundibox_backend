'use strict'
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser=require('body-parser');
var app = express();
//cargar rutas declaracion
var tipoRouter=require('./routes/tipo.route');
// var materialRouter=require('./routes/material.route');
var usuarioRouter=require('./routes/usuario.route');
// var ingresoRouter=require('./routes/ingreso.route');
var egresoRouter=require('./routes/egreso.route');

var productoRouter=require('./routes/producto.route');
var importacionRouter=require('./routes/importacion.route');
var importacionProductoRouter=require('./routes/importacion-producto.route');
var mercadoLibreRouter=require('./routes/mercado-libre.route');
var publicacionRouter=require('./routes/publicacion.route');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//-----
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ "limit": "50mb", extended: true, parameterLimit: 1000000 }));

app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers','Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods','GET,POST,OPTIONS,PUT,DELETE');
  res.header('Allow','GET, POST, OPTIONS, PUT, DELETE');
  next();
});
//comentar para desarrollo
// app.use('/',express.static('client',{redirect:false}));
//-----Rutas creadas -------- 

app.use('/api',tipoRouter);
app.use('/api',usuarioRouter);
app.use('/api',egresoRouter);

app.use('/api',productoRouter);
app.use('/api',importacionRouter);
app.use('/api',importacionProductoRouter);
app.use('/api',mercadoLibreRouter);
app.use('/api',publicacionRouter);

// comentar para desarrollo
// app.get('*',function(req,res,next){
// 	res.sendFile(path.resolve('client/index.html'));
// })

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//rutas base

module.exports = app;
