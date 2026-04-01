const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const { initialize } = require('./db');

const app = express();

/* -------------------------------------------------------
   CORS CONFIGURATION — VERSION FINALE
-------------------------------------------------------- */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
     "https://kasa-frontend-taupe.vercel.app"
    ],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Important pour les requêtes OPTIONS (preflight)
app.options("*", cors());

/* -------------------------------------------------------
   MIDDLEWARES
-------------------------------------------------------- */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------------------------------------
   DATABASE
-------------------------------------------------------- */
initialize()
  .then((db) => {
    app.locals.db = db;
    console.log('Database initialized');
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
  });

/* -------------------------------------------------------
   ROUTES
-------------------------------------------------------- */
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);

module.exports = app;
