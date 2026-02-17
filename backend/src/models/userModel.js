const pool = require('../config/database');


const ROLES={
  ADMIN:'admin',
  EDITOR:'editor',
  VIEWER:'viewer'
};

const createUser = async (email, hashedPassword, role) => {
  const validRoles=Object.values(ROLES);
  if(!validRoles.includes(role)){
    throw new Error (`Invalid role:${role}. Must be one of the ${validRoles.join(', ')}`);
  }
  const result = await pool.query(
    'INSERT INTO users (email, password, role) VALUES ($1,$2,$3) RETURNING id,email,role',
    [email, hashedPassword, role]
  );
  return result.rows[0];
};

const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  return result.rows[0];
};

module.exports = { createUser, getUserByEmail,ROLES };
