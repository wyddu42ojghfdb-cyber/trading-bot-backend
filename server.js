const express = require('express');
const cors = require('cors');
const app = express();

// 🔓 تفعيل CORS لضمان استقبال البيانات من شاشة المستخدم بدون أي حظر سحابي
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));
app.use(express.json());

// قواعد البيانات السحابية المؤقتة لتخزين البيانات
let orders = [];
let usersData = {};

// صفحة ترحيبية للتأكد من أن السيرفر يعمل بنجاح عند فتحه بالمتصفح
app.get('/', (req, res) => {
    res.send('🚀 السيرفر السحابي لمنصة التداول يعمل بنجاح بنسبة 100%!');
});

// 1. استقبال طلبات الإيداع والسحب والدعوة من شاشة المستخدم
app.post('/api/orders', (req, res) => {
    try {
        const order = req.body;
        order.id = Date.now().toString(); // توليد معرف مميز لكل طلب
        order.status = 'قيد الانتظار';
        orders.push(order);
        console.log(`📥 طلب جديد وارد من: ${order.username}`);
        res.status(200).json({ success: true, message: 'تم استلام الطلب سحابياً بنجاح!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. إرسال الطلبات المعلقة إلى لوحة المشرف لكي تظهر له أزرار القبول والرفض
app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

// 3. إرسال الأرصدة الحالية والأرباح المسجلة إلى واجهة المشرف
app.get('/api/admin/users-profits', (req, res) => {
    res.json(usersData);
});

// 4. معالجة قرار المشرف (قبول أو رفض) وتحديث رصيد العضو فوراً في السحاب
app.post('/api/admin/action', (req, res) => {
    const { orderId, action } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const order = orders[orderIndex];

    // تحديث بيانات المستخدم في حال ضغط المشرف على زر "قبول"
    if (action === 'accept') {
        if (!usersData[order.username]) {
            usersData[order.username] = { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 };
        }

        if (order.type === 'إيداع') {
            usersData[order.username].capital += parseFloat(order.amount || 0);
            usersData[order.username].todayProfit += parseFloat(order.amount || 0) * 0.10; // إضافة ربح تلقائي يومي 10%
        } else if (order.type === 'سحب') {
            usersData[order.username].capital = Math.max(0, usersData[order.username].capital - parseFloat(order.amount || 0));
        } else if (order.type === 'مكافأة دعوة') {
            usersData[order.username].teamCount += 1;
            usersData[order.username].inviteProfit += 15; // إضافة 15 دولار لخانة الأرباح المفقودة سابقاً
        }
    }

    // إزالة الطلب من القائمة المعلقة بعد اتخاذ القرار
    orders.splice(orderIndex, 1);
    res.json({ success: true });
});

// 5. فحص دوري من شاشة المستخدم لتحديث الأرقام على هاتف العضو وتجنب التجمد
app.get('/api/users/:username', (req, res) => {
    const username = req.params.username;
    res.json(usersData[username] || { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
});

// إعداد المنفذ المتوافق مع بيئة Vercel السحابية
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر السحابي يعمل الآن على المنفذ ${PORT}`));
