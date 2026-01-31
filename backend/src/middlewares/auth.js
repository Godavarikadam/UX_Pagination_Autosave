const jwt = require('jsonwebtoken');

function authenticate(roleRequired) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roleRequired && decoded.role !== roleRequired && decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
}

module.exports = authenticate;
