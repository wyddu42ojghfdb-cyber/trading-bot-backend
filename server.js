const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// قواعد بيانات مؤقتة لتخزين الطلبات وبيانات المستخدمين
let orders = [];
let usersData = {};

// 1. استقبال الطلبات من شاشة المستخدم
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order.id = Date.now().toString(); // توليد رقم مميز لكل طلب
    orders.push(order);
    console.log(`📥 طلب جديد من العضو: ${order.username} - النوع: ${order.type}`);
    res.status(200).json({ success: true, message: 'تم استلام الطلب بنجاح' });
});

// 2. إرسال الطلبات المعلقة إلى لوحة المشرف
app.get('/api/admin/orders', (req, res) => {
    // إرسال الطلبات التي لم يتم اتخاذ إجراء بشأنها بعد
    res.json(orders.filter(o => o.status !== 'تم القبول' && o.status !== 'تم الرفض'));
});

// 3. معالجة قرار المشرف (قبول أو رفض)
app.post('/api/admin/action', (req, res) => {
    const { orderId, action } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const order = orders[orderIndex];
    order.status = action === 'accept' ? 'تم القبول' : 'تم الرفض';

    // إذا وافق المشرف، نقوم بتحديث رصيد المستخدم تلقائياً
    if (action === 'accept') {
        if (!usersData[order.username]) {
            usersData[order.username] = { capital: 0, todayProfit: 0, teamCount: 0 };
        }

        if (order.type === 'إيداع') {
            usersData[order.username].capital += parseFloat(order.amount);
        } else if (order.type === 'سحب') {
            usersData[order.username].capital = Math.max(0, usersData[order.username].capital - parseFloat(order.amount));
        } else if (order.type === 'مكافأة دعوة') {
            usersData[order.username].teamCount += 1;
            usersData[order.username].todayProfit += 15; // إضافة مكافأة فورية مثلاً بقيمة 15 دولار
        }
    }

    console.log(`🎯 قام المشرف بـ ${action === 'accept' ? 'قبول' : 'رفض'} طلب العضو: ${order.username}`);
    res.json({ success: true });
});

// 4. فحص دوري من شاشة المستخدم لمعرفة رصيده المحدث
app.get('/api/users/:username', (req, res) => {
    const username = req.params.username;
    if (usersData[username]) {
        res.json(usersData[username]);
    } else {
        res.json({ capital: 0, todayProfit: 0, teamCount: 0 });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل بكفاءة فائقة الآن على المنفذ ${PORT}`));
