const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let productionRequests = [];

app.get('/', (req, res) => {
    res.json({ message: "Trading Bot Backend Running Successfully" });
});

// استقبال طلبات الإيداع والسحب من واجهة المستخدم الجديدة
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

// جلب الطلبات لتعرض داخل شاشة المشرف
app.get('/api/requests', (req, res) => {
    res.json(productionRequests);
});

// مسح الطلبات من شاشة المراقبة
app.post('/api/clear', (req, res) => {
    productionRequests = [];
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
