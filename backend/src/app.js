const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const productRoutes = require('./routes/products');

const activityRoutes = require('./routes/activity');
const authRoutes = require('./routes/auth');

const errorHandler = require('./middlewares/errorHandler');

const settingRoutes = require('./routes/settingRoutes');
const formRoutes = require('./routes/formRoutes');
const orderRoute = require('./routes/orderRoute');



require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);     
app.use('/api/products', productRoutes);

app.use('/api/activity', activityRoutes);

app.use('/api/settings', settingRoutes);

app.use('/api/forms', formRoutes);

app.use('/api/orders', orderRoute);


app.use(errorHandler);

module.exports = app;
