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
   CORS — COMPATIBLE EXPRESS 5 + NODE 24 + RENDER + VERCEL
-------------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "https://kasa-frontend-taupe.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman, Thunder Client
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* -------------------------------------------------------
   FIX EXPRESS 5 — INTERCEPTER OPTIONS SANS WILDCARD
-------------------------------------------------------- */
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.sendStatus(200);
  }
  next();
});

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
