const express = require('express');
const cors = require('cors');
const app = express();

// تفعيل حماية CORS للسماح للمتصفح بنقل البيانات بين الشاشات بأمان
app.use(cors());
app.use(express.json());

// مصفوفة (مخزن مؤقت) لحفظ الطلبات القادمة من المستخدمين
let productionRequests = [];

// رابط لفحص عمل السيرفر الأساسي
app.get('/', (req, res) => {
    res.json({ message: "Trading Bot Backend Running Successfully" });
});

// 1. مسار استقبال طلب جديد من واجهة المستخدم (index.html)
app.post('/api/deposit', (req, res) => {
    const { amount, wallet, type } = req.body;
    
    const newRequest = {
        id: Date.now(),
        amount: amount,
        wallet: wallet,
        type: type || 'إيداع',
        status: 'معلق',
        date: new Date().toLocaleString('ar-EG')
    };
    
    productionRequests.push(newRequest);
    res.status(201).json({ success: true, message: "تم إرسال الطلب للمشرف بنجاح", data: newRequest });
});

// 2. مسار جلب الطلبات لواجهة المشرف (admin.html)
app.get('/api/requests', (req, res) => {
    res.json(productionRequests);
});

// 3. مسار مسح أو تحديث الطلبات (عندما يوافق المشرف أو يرفض)
app.post('/api/clear', (req, res) => {
    productionRequests = [];
    res.json({ success: true, message: "تم تنظيف شاشة المراقبة" });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
