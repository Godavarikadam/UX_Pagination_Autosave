const pool = require('../config/database'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const VALID_ROLES = ['admin', 'editor'];


exports.registerUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password and role are required' });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Only admin and editor are allowed.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, role]
    );

    res.json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { 
      return res.status(400).json({ message: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    // 🟢 1. FETCH CONFIGURABLE SETTINGS FROM DB
    const settingsRes = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('auth_max_attempts', 'auth_lockout_duration')"
    );
    
    // Map settings to an object for easy access: { auth_max_attempts: '5', ... }
    const config = {};
    settingsRes.rows.forEach(row => config[row.key] = row.value);

    // Convert to numbers and provide fallbacks just in case
    const MAX_ATTEMPTS = parseInt(config.auth_max_attempts) || 5;
    const LOCKOUT_MINS = parseInt(config.auth_lockout_duration) || 15;

    // 🟢 2. FIND THE USER
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ field: 'email', message: 'Email not registered.' });
    }

    // 🟢 3. CHECK DYNAMIC LOCKOUT STATUS
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      const msLeft = new Date(user.lockout_until) - new Date();
      const minsLeft = Math.ceil(msLeft / 60000);
      return res.status(403).json({ 
        field: 'form',
        message: `Account locked. Please try again in ${minsLeft} minutes.` 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      let lockoutUntil = null;
      let responseMessage = `Incorrect password. Attempt ${newAttempts}/${MAX_ATTEMPTS}`;

      // 🟢 4. APPLY DYNAMIC THRESHOLD FROM DB
      if (newAttempts >= MAX_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + LOCKOUT_MINS * 60 * 1000);
        responseMessage = `Too many failed attempts. Account locked for ${LOCKOUT_MINS} minutes.`;
      }

      await pool.query(
        'UPDATE users SET failed_attempts = $1, lockout_until = $2 WHERE id = $3',
        [newAttempts, lockoutUntil, user.id]
      );

      return res.status(401).json({ field: 'password', message: responseMessage });
    }

    
    await pool.query(
      'UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, role FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
