const express = require('express');
const cors = require('cors');
const app = express();

// 🔓 1. تفعيل حزمة الـ CORS لفتح الحظر السحابي تماماً بين الواجهات
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// 📦 2. قواعد البيانات السحابية المؤقتة لحفظ الطلبات والأرصدة بدون مسح
let orders = [];
let usersData = {};

// صفحة ترحيبية للتأكد من عمل السيرفر عند فتحه مباشرة
app.get('/', (req, res) => {
    res.send('🚀 Sunucu Aktif ve Sorunsuz Çalışıyor!');
});

// 👤 3. استقبال تسجيل العضوية وقفل الحساب الفوري لزيادة عداد الأعضاء
app.post('/api/register-user', (req, res) => {
    const { username } = req.body;
    if (username && !usersData[username]) {
        usersData[username] = { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 };
        console.log(`👤 عضو جديد قفل حسابه: ${username}`);
    }
    res.json({ success: true });
});

// 📥 4. استقبال طلبات الإيداع والسحب الثلاثة ومكافأة الدعوة من شاشة المستخدم
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order.id = Date.now().toString(); // توليد رقم مميز للطلب
    order.status = 'قيد الانتظار';
    orders.push(order);
    console.log(`📥 طلب جديد وارد من: ${order.username} | النوع: ${order.type}`);
    res.status(200).json({ success: true });
});

// 🖥️ 5. تزويد شاشة المشرف بالطلبات المنتظرة لعرضها في الجدول الأول
app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

// 📊 6. تزويد شاشة المشرف بأرصدة وأرباح الأعضاء وعدد المشتركين الكلي للجدول الثاني
app.get('/api/admin/users-profits', (req, res) => {
    res.json(usersData);
});

// 💰 7. زر المشرف اليدوي لتوزيع أرباح الـ 15% على الحسابات المشحونة فقط
app.post('/api/admin/distribute-profits', (req, res) => {
    let count = 0;
    for (let username in usersData) {
        const user = usersData[username];
        if (user.capital > 0) {
            user.todayProfit += user.capital * 0.15; // زيادة 15% من رأس المال المشحون
            count++;
        }
    }
    console.log(`🎯 قام المشرف بتوزيع أرباح الـ 15% يدوياً على ${count} حساب.`);
    res.json({ success: true, message: `Başarıyla ${count} hesaba %15 kâr dağıtıldı!` });
});

// 🎯 8. معالجة قرار المشرف (قبول أو رفض) لتحديث الخانات الثلاث للسحب والإيداع
app.post('/api/admin/action', (req, res) => {
    const { orderId, action } = req.body;
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) return res.status(404).json({ success: false });

    const order = orders[orderIndex];

    if (action === 'accept') {
        // تأمين وجود الحساب في الذاكرة السحابية
        if (!usersData[order.username]) {
            usersData[order.username] = { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 };
        }

        // التعرف على العمليات القادمة من الأزرار الثلاثة لشاشة المستخدم وتنفيذها بدقة
        if (order.type === 'Yatırma') { // طلب إيداع
            usersData[order.username].capital += parseFloat(order.amount || 0);
        } else if (order.type === 'Toplam Sermaye Çekme') { // سحب رأس المال بالكامل
            usersData[order.username].capital = Math.max(0, usersData[order.username].capital - parseFloat(order.amount || 0));
        } else if (order.type === 'Bugünkü Kâr Çekme') { // سحب أرباح اليوم
            usersData[order.username].todayProfit = Math.max(0, usersData[order.username].todayProfit - parseFloat(order.amount || 0));
        } else if (order.type === 'Davetiye Ödülü Çekme') { // سحب أرباح الدعوات
            usersData[order.username].inviteProfit = Math.max(0, usersData[order.username].inviteProfit - parseFloat(order.amount || 0));
        } else if (order.type === 'Referans Bonusu') { // طلب مكافأة دعوة صديق
            usersData[order.username].teamCount += 1;
            usersData[order.username].inviteProfit += 15; // إضافة 15 دولار لخانة المكافآت المستقلة
        }
    }

    // إزالة الطلب من الجدول بعد اتخاذ القرار (قبول/رفض)
    orders.splice(orderIndex, 1);
    res.json({ success: true });
});

// 🔄 9. الفحص الدوري المستمر لتحديث خانات وأرصدة شاشة المستخدم تلقائياً
app.get('/api/users/:username', (req, res) => {
    const username = req.params.username;
    res.json(usersData[username] || { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
});

// ⚙️ إعداد منفذ التشغيل السحابي لـ Render و Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر المحدث يعمل بكفاءة كاملة على المنفذ ${PORT}`));
