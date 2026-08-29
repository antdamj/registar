function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nije autentificiran.' });
    }

    if (!req.user.appRole || !allowedRoles.includes(req.user.appRole)) {
      return res.status(403).json({ error: 'Nema ovlasti.' });
    }

    next();
  };
}

module.exports = { authorize };
