const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// 1. تفعيل CORS وحظر الحساب السحابي تماماً بين الواجهات
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// 2. الاتصال بقاعدة بيانات MongoDB باستخدام الرابط من ملف .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 تم الاتصال بنجاح بقاعدة بيانات MongoDB!'))
  .catch(err => console.error('❌ فشل الاتصال بقاعدة البيانات:', err));

// 3. تصميم جداول قاعدة البيانات (Schemas & Models)
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

// 4. صفحة ترحيبية للتأكد من عمل السيرفر
app.get('/', (req, res) => {
    res.send('🚀 Sunucu Aktif ve Sorunsuz Çalışıyor!');
});

// 5. تسجيل العضوية وقفل الحساب الفوري
app.post('/api/register-user', async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'اسم المستخدم مطلوب' });

    try {
        let user = await User.findOne({ username });
        if (!user) {
            user = new User({ username });
            await user.save();
            console.log(`👤 عضو جديد قفل حسابه: ${username}`);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. الإيداع والسحب الثلاثة ومكافأة الدعوة من شاشة المستخدم
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
        console.log(`📩 طلب جديد من: ${username} | النوع: ${type}`);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 7. شاشة المشرف بالطلبات المنتظرة لعرضها في الجدول الأول
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find({ status: 'قيد الانتظار' });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. أرصدة وأرباح الأعضاء وعدد المشتركين الكلي للجدول الثاني
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
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 9. اليدوي لتوزيع أرباح الـ 15% على الحسابات المشحونة فقط
app.post('/api/admin/distribute-profits', async (req, res) => {
    try {
        const result = await User.updateMany(
            { capital: { \(gt: 0 } },             [ {\)set: { todayProfit: { \(add: ["\)todayProfit", { \(multiply: ["\)capital", 0.15] }] } } } ]
        );
        console.log(`💰 تم توزيع أرباح الـ 15% يدوياً على الحسابات النشطة.`);
        res.json({ success: true, message: 'Başarıyla Dağıtıldı' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 10. (قبول أو رفض) لتحديث الخانات الثلاث للسحب والإيداع
app.post('/api/admin/action', async (req, res) => {
    const { orderId, action } = req.body;
    try {
        const order = await Order.findOne({ id: orderId });
        if (!order) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

        if (action === 'accept') {
            let user = await User.findOne({ username: order.username });
            if (!user) user = new User({ username: order.username });

            if (order.type === 'Yatırma') {
                user.capital += order.amount;
            } else if (order.type === 'Toplam Sermayeyi Çek') {
                user.capital = 0;
            } else if (order.type === 'Bugünkü Kârı Çek') {
                user.todayProfit = 0;
            } else if (order.type === 'Davetiye Ödülünü Çek') {
                user.inviteProfit = 0;
            } else if (order.type === 'Referans Bonusunu Çek') {
                user.teamCount = 0; // أو الحسبة المعتمدة لديك
            }
            await user.save();
        }

        // تحديث حالة الطلب بدلاً من مسحه نهائياً ليتم استبعاده من قائمة الانتظار
        order.status = action === 'accept' ? 'مقبول' : 'مرفوض';
        await order.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 11. تحديث مستمر لتحديث خانات وأرصدة شاشة المستخدم تلقائياً
app.get('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (user) {
            res.json(user);
        } else {
            res.json({ capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 12. إعداد منفذ التشغيل السحابي لـ Vercel و Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ: ${PORT}`));
