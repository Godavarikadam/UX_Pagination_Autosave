const pool = require('../config/database');

const placeOrder = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id; 
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const productRes = await client.query(
            `UPDATE products SET quantity = quantity - $1 
             WHERE id = $2 AND quantity >= $1 AND status = 'active'
             RETURNING name, unit_price, quantity as current_qty`, 
            [quantity, productId]
        );

        if (productRes.rowCount === 0) {
            throw new Error("Product unavailable or insufficient stock.");
        }

        const product = productRes.rows[0];
        const totalPrice = product.unit_price * quantity;

        const orderRes = await client.query(
            `INSERT INTO orders (user_id, product_id, quantity, unit_price_at_purchase, total_price)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [userId, productId, quantity, product.unit_price, totalPrice]
        );

        await client.query(
            `INSERT INTO activity_log (entity_type, entity_id, field_name, old_value, new_value, status, created_by)
             VALUES ('product', $1, 'purchase', $2, $3, 'success', $4)`,
            [productId, product.current_qty + quantity, product.current_qty, userId]
        );

        await client.query('COMMIT');
        res.status(201).json({ 
            success: true, 
            orderId: orderRes.rows[0].id,
            message: "Order placed successfully!" 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

const getMyOrders = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, p.name as product_name, p.category 
             FROM orders o 
             LEFT JOIN products p ON o.product_id = p.id 
             WHERE o.user_id = $1 
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error fetching history" });
    }
};

// 🟢 Ensure these names match what you use in orderRoute.js
module.exports = {
    placeOrder,
    getMyOrders
};