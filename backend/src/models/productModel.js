const pool = require('../config/database');

const getProducts = async (limit, offset) => {
  const products = await pool.query(
    'SELECT * FROM products ORDER BY id ASC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return products.rows;
};

const getProductById = async (id) => {
  const result = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
  return result.rows[0];
};

const updateProduct = async (id, fields) => {
  const setClause = Object.keys(fields)
    .map((key, idx) => `${key}=$${idx + 1}`)
    .join(', ');

  const values = [...Object.values(fields), id];

  await pool.query(`UPDATE products SET ${setClause}, updated_at=NOW() WHERE id=$${values.length}`, values);
};

module.exports = { getProducts, getProductById, updateProduct };
