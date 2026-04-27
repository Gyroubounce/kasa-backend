const { register, login, requestPasswordReset, resetPassword } = require('../services/authService');

function statusFromError(e) {
  if (e && e.status) return e.status;
  return 500;
}

/* -------------------------------------------------------
   UTILITAIRE : CONFIG COOKIE SELON ENVIRONNEMENT
-------------------------------------------------------- */
function getCookieConfig() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,              // secure = true en production
    sameSite: "none",            // obligatoire pour Vercel
    path: "/",
    domain: process.env.COOKIE_DOMAIN || "localhost",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
  };
}

/* -------------------------------------------------------
   REGISTER
-------------------------------------------------------- */
async function doRegister(req, res) {
  const db = req.app.locals.db;
  try {
    const result = await register(db, req.body || {});

    res.cookie("token", result.token, getCookieConfig());

    res.status(201).json({ user: result.user });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: e.message });
  }
}

/* -------------------------------------------------------
   LOGIN
-------------------------------------------------------- */
async function doLogin(req, res) {
  const db = req.app.locals.db;
  try {
    const { token, user } = await login(db, req.body || {});

    res.cookie("token", token, getCookieConfig());

    res.status(200).json({ user });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: e.message });
  }
}

/* -------------------------------------------------------
   PASSWORD RESET
-------------------------------------------------------- */
async function doRequestReset(req, res) {
  const db = req.app.locals.db;
  try {
    const result = await requestPasswordReset(db, req.body || {});
    res.status(200).json(result);
  } catch (e) {
    res.status(statusFromError(e)).json({ error: e.message });
  }
}

async function doResetPassword(req, res) {
  const db = req.app.locals.db;
  try {
    const result = await resetPassword(db, req.body || {});
    res.status(200).json(result);
  } catch (e) {
    res.status(statusFromError(e)).json({ error: e.message });
  }
}

/* -------------------------------------------------------
   ME
-------------------------------------------------------- */
function doMe(req, res) {
  res.json({ user: req.user });
}

/* -------------------------------------------------------
   LOGOUT
-------------------------------------------------------- */
function doLogout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    domain: process.env.COOKIE_DOMAIN || "localhost",
  });

  return res.status(200).json({ ok: true });
}

module.exports = { 
  doRegister, 
  doLogin, 
  doRequestReset, 
  doResetPassword, 
  doMe, 
  doLogout 
};
