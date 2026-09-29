const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

let orders = [];
let usersData = {};

// 1. استقبال طلبات الإيداع والسحب والدعوة من شاشة المستخدم
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order.id = Date.now().toString();
    order.status = 'قيد الانتظار';
    orders.push(order);
    res.status(200).json({ success: true });
});

// 2. إرسال الطلبات المعلقة إلى لوحة المشرف
app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

// 3. إرسال الأرصدة الحالية لواجهة المشرف لمراقبتها
app.get('/api/admin/users-profits', (req, res) => {
    res.json(usersData);
});

// 4. [الميزة المطلوبة]: زر المشرف اليدوي لتوزيع أرباح الـ 15% على الحسابات المشحونة فقط
app.post('/api/admin/distribute-profits', (req, res) => {
    let count = 0;
    for (let username in usersData) {
        const user = usersData[username];
        if (user.capital > 0) {
            // الزيادة تتم فقط هنا عند ضغط الزر وبنسبة 15% من رأس المال
            user.todayProfit += user.capital * 0.15;
            count++;
        }
    }
    console.log(`🎯 قام المشرف بتوزيع الأرباح يدوياً على ${count} مستخدم.`);
    res.json({ success: true, message: `تم توزيع الأرباح بنجاح على ${count} حساب!` });
});

// 5. معالجة قرارات القبول والرفض للطلبات العادية
app.post('/api/admin/action', (req, res) => {
    const { orderId, action } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) return res.status(404).json({ success: false });

    const order = orders[orderIndex];

    if (action === 'accept') {
        if (!usersData[order.username]) {
            usersData[order.username] = { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 };
        }

        if (order.type === 'Yatırma') {
            usersData[order.username].capital += parseFloat(order.amount || 0);
        } else if (order.type === 'Toplam Sermaye Çekme') {
            usersData[order.username].capital = Math.max(0, usersData[order.username].capital - parseFloat(order.amount || 0));
        } else if (order.type === 'Bugünkü Kâr Çekme') {
            usersData[order.username].todayProfit = Math.max(0, usersData[order.username].todayProfit - parseFloat(order.amount || 0));
        } else if (order.type === 'Davetiye Ödülü Çekme') {
            usersData[order.username].inviteProfit = Math.max(0, usersData[order.username].inviteProfit - parseFloat(order.amount || 0));
        } else if (order.type === 'Referans Bonusu') {
            usersData[order.username].teamCount += 1;
            usersData[order.username].inviteProfit += 15;
        }
    }

    orders.splice(orderIndex, 1);
    res.json({ success: true });
});

// 6. فحص دوري من شاشة المستخدم لتلقي الأرقام الحية
app.get('/api/users/:username', (req, res) => {
    const username = req.params.username;
    res.json(usersData[username] || { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر يعمل بكفاءة على المنفذ ${PORT}`));
