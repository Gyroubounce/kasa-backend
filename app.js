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
   TEMPLATE ENGINE DISABLED
-------------------------------------------------------- */
app.set('views', path.join(__dirname, 'dummy-views'));
app.set('view engine', 'html');

/* -------------------------------------------------------
   CORS — VERSION 100% COMPATIBLE VERCEL + RENDER
-------------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "https://kasa-frontend-taupe.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Autorise les outils comme Postman (origin = undefined)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Fix préflight OPTIONS
app.options("/(.*)", cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* -------------------------------------------------------
   MIDDLEWARES
-------------------------------------------------------- */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* -------------------------------------------------------
   STATIC FILES
-------------------------------------------------------- */
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
app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use('/', indexRouter);

module.exports = app;
