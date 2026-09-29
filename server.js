const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// قواعد البيانات المؤقتة لتخزين الطلبات وبيانات أرصدة المستخدمين
let orders = [];
let usersData = {};

// 1. استقبال الطلبات من شاشة المستخدم وحفظها
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order.id = Date.now().toString(); // توليد رقم مميز لكل طلب
    order.status = 'قيد الانتظار';
    orders.push(order);
    console.log(`📥 طلب جديد من: ${order.username} | النوع: ${order.type}`);
    res.status(200).json({ success: true, message: 'تم استلام الطلب في السيرفر' });
});

// 2. إرسال الطلبات المعلقة إلى لوحة المشرف لكي تظهر أمامه
app.get('/api/admin/orders', (req, res) => {
    // عرض الطلبات المعلقة فقط التي تنتظر قرار المشرف
    res.json(orders.filter(o => o.status === 'قيد الانتظار'));
});

// 3. إرسال الأرصدة الحالية لجدول مراقبة الأعضاء في لوحة المشرف
app.get('/api/admin/users-profits', (req, res) => {
    res.json(usersData);
});

// 4. معالجة قرار المشرف عند الضغط على (قبول أو رفض)
app.post('/api/admin/action', (req, res) => {
    const { orderId, action } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const order = orders[orderIndex];
    order.status = action === 'accept' ? 'تم القبول' : 'تم الرفض';

    // إنشاء سجل للمستخدم إذا كان جديداً
    if (!usersData[order.username]) {
        usersData[order.username] = { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 };
    }

    // تطبيق القرار البرمجي وتحديث الأرصدة في حال "القبول" فقط
    if (action === 'accept') {
        if (order.type === 'إيداع') {
            usersData[order.username].capital += parseFloat(order.amount);
            // إضافة ربح تلقائي فوري موازي للإيداع بنسبة 10% كمثال
            usersData[order.username].todayProfit += parseFloat(order.amount) * 0.10;
        } else if (order.type === 'سحب') {
            usersData[order.username].capital = Math.max(0, usersData[order.username].capital - parseFloat(order.amount));
        } else if (order.type === 'مكافأة دعوة') {
            usersData[order.username].teamCount += 1;
            usersData[order.username].inviteProfit += 15; // إضافة 15 دولار لخانة أرباح المكافأة المضافة حديثاً
        }
    }

    // إزالة الطلب من القائمة النشطة بعد اتخاذ القرار
    orders.splice(orderIndex, 1);
    
    console.log(`🎯 قرار المشرف: ${action === 'accept' ? 'قبول' : 'رفض'} طلب العضو ${order.username}`);
    res.json({ success: true });
});

// 5. استقبال طلبات الفحص الدوري من شاشة المستخدم لتحديث الأرقام على هاتفه
app.get('/api/users/:username', (req, res) => {
    const username = req.params.username;
    res.json(usersData[username] || { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر متصل ويعمل بكفاءة على المنفذ ${PORT}`));
