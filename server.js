const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('DB Connected'))
  .catch(err => console.log(err));

const OrderSchema = new mongoose.Schema({
    username: String,
    type: String,
    amount: Number,
    status: { type: String, default: 'قيد الانتظار' }
});
const Order = mongoose.model('Order', OrderSchema);

app.get('/', (req, res) => res.send('Server Running'));

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.json({ success: true });
    } catch (err) { res.status(500).json(err); }
});

app.get('/api/admin/orders', async (req, res) => {
    const orders = await Order.find({ status: 'قيد الانتظار' });
    res.json(orders);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Running on ' + PORT));
