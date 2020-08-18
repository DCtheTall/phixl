const express = require('express');
const morgan = require('morgan');
const {join, resolve} = require('path');
const fs = require('fs');

const app = module.exports = express();

app.use(morgan('dev'));
app.use(express.static(join(resolve('.'), 'public')));

app.set('view engine', 'pug');
app.set('views', join(resolve('.'), 'views'));

app.get('/', (req, res) => res.render('index'));