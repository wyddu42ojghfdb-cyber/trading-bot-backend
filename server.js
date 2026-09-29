const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// مخازن سحابية ثابتة للطلبات والأرصدة داخل السيرفر
let globalOrders = [];
let globalBalances = { capital: 0, todayProfit: 0, inviteProfit: 0 };

app.get('/', (req, res) => {
    res.json({ message: "Cloud Server Connection Active!" });
});

// مسار استقبال طلب جديد من المستخدم
app.post('/api/deposit', (req, res) => {
    const { amount, wallet, type } = req.body;
    const newRequest = {
        id: Date.now(),
        amount: parseFloat(amount) || 0,
        wallet: wallet,
        type: type,
        status: 'معلق',
        date: new Date().toLocaleString('ar-EG')
    };
    globalOrders.push(newRequest);
    res.status(201).json({ success: true, data: newRequest });
});

// مسار جلب الطلبات للمشرف
app.get('/api/requests', (req, res) => {
    res.json(globalOrders);
});

// مسار جلب الأرصدة الحالية للمستخدم
app.get('/api/balances', (req, res) => {
    res.json(globalBalances);
});

// مسار تحديث حالة الطلب (موافق / رفض) من قبل المشرف وتعديل الرصيد
app.post('/api/update-status', (req, res) => {
    const { id, newStatus } = req.body;
    
    globalOrders = globalOrders.map(req => {
        if (req.id === id && req.status === 'معلق') {
            req.status = newStatus;
            
            // إذا ضغط المشرف موافق، يتم تعديل الرصيد في السيرفر فوراً
            if (newStatus === 'تم القبول') {
                if (req.type === 'إيداع') {
                    globalBalances.capital += req.amount;
                } else if (req.type === 'سحب كلّي') {
                    globalBalances.capital = 0;
                } else if (req.type === 'سحب اليوم') {
                    globalBalances.todayProfit -= req.amount;
                } else if (req.type === 'سحب أرباح الدعوة') {
                    globalBalances.inviteProfit -= req.amount;
                }
            }
        }
        return req;
    });
    res.json({ success: true });
});

// 🚀 مسار بث أرباح الصفقة اليومية 15% لجميع المشتركين
app.post('/api/broadcast', (req, res) => {
    if (globalBalances.capital <= 0) {
        return res.json({ success: false, message: "رأس المال صفر" });
    }
    const profit = globalBalances.capital * 0.15;
    globalBalances.todayProfit += profit;
    res.json({ success: true, profit: profit });
});

// مسار تنظيف وتصفير السجلات
app.post('/api/clear', (req, res) => {
    globalOrders = [];
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Active Server on ${PORT}`));

module.exports = app;
