const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fetch = require('node-fetch'); // تأكد من وجودها في package.json

const app = express();

// تفعيل CORS المفتوح الكامل لمنع تجميد الشاشات العربية نهائياً
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// الاتصال بقاعدة بيانات MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 DB Connected Successfully'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// تصميم جداول قاعدة البيانات
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    capital: { type: Number, default: 0 },
    todayProfit: { type: Number, default: 0 },
    inviteProfit: { type: Number, default: 0 },
    teamCount: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

const OrderSchema = new mongoose.Schema({
    id: { type: String, required: true },
    username: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, default: 'قيد الانتظار' },
    amount: { type: Number, default: 0 },
    address: { type: String, default: '' }
});
const Order = mongoose.model('Order', OrderSchema);

// صفحة فحص عمل السيرفر
app.get('/', (req, res) => {
    res.send('Server Running');
});

// تسجيل العضوية وقفل الحساب
app.post('/api/register-user', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'اسم المستخدم مطلوب' });
    try {
        let user = await User.findOne({ username });
        if (!user) {
            user = new User({ username });
            await user.save();
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// إرسال الطلبات من شاشة المستخدم
app.post('/api/orders', async (req, res) => {
    const { username, type, amount, address } = req.body;
    try {
        const newOrder = new Order({
            id: Date.now().toString(),
            username,
            type,
            amount: amount || 0,
            address: address || '',
            status: 'قيد الانتظار'
        });
        await newOrder.save();
        res.status(200).json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// جلب الطلبات لوحة المشرف
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'قيد الانتظار' });
        res.json(orders);
    } catch (error) { res.status(500).json(error); }
});

// جلب المستخدمين للوحة المشرف
app.get('/api/admin/users-profits', async (req, res) => {
    try {
        const users = await User.find({});
        const usersData = {};
        users.forEach(user => {
            usersData[user.username] = {
                capital: user.capital,
                todayProfit: user.todayProfit,
                inviteProfit: user.inviteProfit,
                teamCount: user.teamCount
            };
        });
        res.json(usersData);
    } catch (error) { res.status(500).json(error); }
});

// توزيع أرباح 15%
app.post('/api/admin/distribute-profits', async (req, res) => {
    try {
        await User.updateMany(
            { capital: { \(gt: 0 } },             [ {\)set: { todayProfit: { \(add: ["\)todayProfit", { \(multiply: ["\)capital", 0.15] }] } } } ]
        );
        res.json({ success: true });
    } catch (error) { res.status(500).json(error); }
});

// قبول أو رفض الطلبات
app.post('/api/admin/action', async (req, res) => {
    const { orderId, action } = req.body;
    try {
        const order = await Order.findOne({ id: orderId });
        if (!order) return res.status(404).json({ success: false });

        if (action === 'accept') {
            let user = await User.findOne({ username: order.username });
            if (!user) user = new User({ username: order.username });

            if (order.type === 'Yatırma') user.capital += order.amount;
            else if (order.type === 'Toplam Sermayeyi Çek') user.capital = 0;
            else if (order.type === 'Bugünkü Kârı Çek') user.todayProfit = 0;
            else if (order.type === 'Davetiye Ödülünü Çek') user.inviteProfit = 0;
            else if (order.type === 'Referans Bonusunu Çek') user.inviteProfit += order.amount;
            await user.save();
        }
        order.status = action === 'accept' ? 'مقبول' : 'مرفوض';
        await order.save();
        res.json({ success: true });
    } catch (error) { res.status(500).json(error); }
});

// جلب بيانات مستخدم منفرد
app.get('/api/users/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (user) res.json(user);
        else res.json({ capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
    } catch (error) { res.status(500).json(error); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    
    // أمر اليقظة الذاتي لمنع السيرفر من النوم نهائياً (يتكرر كل 10 دقائق)
    setInterval(() => {
        fetch('https://onrender.com')
            .then(() => console.log('⏰ Keep-Alive: Pinged successfully to stay awake!'))
            .catch(err => console.error('Keep-Alive error:', err));
    }, 600000); 
});
