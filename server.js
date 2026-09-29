const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// قواعد البيانات المؤقتة لتخزين الطلبات وبيانات الحسابات
let orders = [];
let usersData = {};

// 1. استقبال الطلبات من واجهة المستخدم
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order.id = Date.now().toString(); // توليد رقم مميز
    order.status = 'قيد الانتظار';
    orders.push(order);
    console.log(`📥 طلب جديد من: ${order.username} | النوع: ${order.type}`);
    res.status(200).json({ success: true, message: 'تم استلام الطلب بنجاح' });
});

// 2. إرسال الطلبات المعلقة إلى واجهة المشرف
app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

// 3. إرسال أرباح وأرصدة الأعضاء إلى واجهة المشرف
app.get('/api/admin/users-profits', (req, res) => {
    res.json(usersData);
});

// 4. معالجة قرار المشرف (قبول أو رفض) وتحديث رصيد العضو فوراً
app.post('/api/admin/action', (req, res) => {
    const { orderId, action } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const order = orders[orderIndex];

    // إذا وافق المشرف، نقوم بتحديث أرصدة وخانات العضو في السيرفر
    if (action === 'accept') {
        if (!usersData[order.username]) {
            usersData[order.username] = { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 };
        }

        if (order.type === 'إيداع') {
            usersData[order.username].capital += parseFloat(order.amount);
            usersData[order.username].todayProfit += parseFloat(order.amount) * 0.10; // ربح تلقائي 10%
        } else if (order.type === 'سحب') {
            usersData[order.username].capital = Math.max(0, usersData[order.username].capital - parseFloat(order.amount));
        } else if (order.type === 'مكافأة دعوة') {
            usersData[order.username].teamCount += 1;
            usersData[order.username].inviteProfit += 15; // إضافة 15 دولار لخانة المكافآت
        }
    }

    // حذف الطلب من القائمة المعلقة بعد اتخاذ الإجراء
    orders.splice(orderIndex, 1);
    res.json({ success: true });
});

// 5. فحص دوري من واجهة المستخدم لتحديث الأرقام على هاتف العضو
app.get('/api/users/:username', (req, res) => {
    const username = req.params.username;
    res.json(usersData[username] || { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل الآن ويربط الواجهتين على المنفذ ${PORT}`));
