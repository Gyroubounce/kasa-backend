const { register, login, requestPasswordReset, resetPassword } = require('../services/authService');

function statusFromError(e) {
  if (e && e.status) return e.status;
  return 500;
}

/* -------------------------------------------------------
   CONFIG COOKIE (LOCAL vs PRODUCTION)
-------------------------------------------------------- */
function getCookieConfig() {
  const isProd = process.env.NODE_ENV === "production";

  const config = {
    httpOnly: true,
    secure: isProd,                     // HTTPS obligatoire en prod
    sameSite: isProd ? "none" : "lax",  // none en prod, lax en local
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,    // 7 jours
  };


  return config;
}

/* -------------------------------------------------------
   REGISTER
-------------------------------------------------------- */
async function doRegister(req, res) {
  const db = req.app.locals.db;
  try {
   

    const result = await register(db, req.body || {});

    const cookieConfig = getCookieConfig();
    res.cookie("token", result.token, cookieConfig);

  

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

    const cookieConfig = getCookieConfig();
    res.cookie("token", token, cookieConfig);

 

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
  const isProd = process.env.NODE_ENV === "production";



  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
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
