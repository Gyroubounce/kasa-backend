const { register, login, requestPasswordReset, resetPassword } = require('../services/authService');

function statusFromError(e) {
  if (e && e.status) return e.status;
  return 500;
}

async function doRegister(req, res) {
  const db = req.app.locals.db;
  try {
    const result = await register(db, req.body || {});
    res.status(201).json(result);
  } catch (e) {
    res.status(statusFromError(e)).json({ error: e.message });
  }
}

async function doLogin(req, res) {
  const db = req.app.locals.db;
  try {
    const { token, user } = await login(db, req.body || {});

    // Pose le cookie HTTP-only
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // mettre false en local si besoin
      sameSite: "none",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    });

    res.status(200).json({ user });
  } catch (e) {
    res.status(statusFromError(e)).json({ error: e.message });
  }
}


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

function doMe(req, res) {
  res.json({ user: req.user });
}

function doLogout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  return res.status(200).json({ ok: true });
}

module.exports = { doRegister, doLogin, doRequestReset, doResetPassword, doMe, doLogout };
