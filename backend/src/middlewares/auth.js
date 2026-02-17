const jwt = require('jsonwebtoken');

function authenticate(allowedRoles=[]) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if(allowedRoles.length===0) return next();

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({message: `Forbidden: Access denied for role ${decoded.role}` });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
}

module.exports = authenticate;
