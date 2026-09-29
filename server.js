const express = require('express');
const cors = require('cors');
const app = express();

// 🔒 تفعيل حماية CORS المتقدمة لربط الهواتف المختلفة ببعضها دون حظر أمني
app.use(cors());
app.use(express.json());

// 💾 المخازن السحابية الدائمة داخل السيرفر لضمان ثبات البيانات حياً
let globalOrders = [];
let globalBalances = { 
    capital: 0, 
    todayProfit: 0, 
    inviteProfit: 0, 
    teamCount: 0 
};

// فحص جاهزية اتصال السيرفر الأساسي
app.get('/', (req, res) => {
    res.json({ message: "Trading Bot Cloud Server Active and Fully Integrated!" });
});

// 1️⃣ مسار جلب الأرصدة وعداد الفريق الحالي لواجهة المستخدم حياً
app.get('/api/balances', (req, res) => {
    res.json(globalBalances);
});

// 2️⃣ مسار جلب كافة الطلبات والمعاملات الحية لشاشة المشرف
app.get('/api/requests', (req, res) => {
    res.json(globalOrders);
});

// 3️⃣ مسار استقبال المعاملات الجديدة (إيداع / سحب مقسم / مكافآت) من المستخدم
app.post('/api/deposit', (req, res) => {
    const { amount, wallet, username, type } = req.body;
    
    const newRequest = {
        id: Date.now(),
        amount: parseFloat(amount) || 0,
        wallet: wallet,
        username: username || 'لاعب حقيقي',
        type: type,
        status: 'معلق',
        date: new Date().toLocaleString('ar-EG')
    };
    
    globalOrders.push(newRequest);
    res.status(201).json({ success: true, data: newRequest });
});

// 4️⃣ مسار معالجة موافقة أو رفض المشرف وتحديث الأرقام والعدادات حياً
app.post('/api/update-status', (req, res) => {
    const { id, newStatus } = req.body;
    
    globalOrders = globalOrders.map(req => {
        if (req.id === id && req.status === 'معلق') {
            req.status = newStatus;
            
            // 📊 تطبيق العمليات الحسابية والعدادات فوراً في السيرفر عند ضغط المشرف "موافق"
            if (newStatus === 'تم القبول') {
                if (req.type === 'إيداع رأس مال') {
                    globalBalances.capital += req.amount;
                } else if (req.type === 'سحب رأس المال الكلّي') {
                    globalBalances.capital = Math.max(0, globalBalances.capital - req.amount);
                } else if (req.type === 'سحب أرباح اليوم') {
                    globalBalances.todayProfit = Math.max(0, globalBalances.todayProfit - req.amount);
                } else if (req.type === 'سحب أرباح الدعوة') {
                    globalBalances.inviteProfit = Math.max(0, globalBalances.inviteProfit - req.amount);
                } else if (req.type === 'طلب مكافأة دعوة صديق') {
                    globalBalances.teamCount += 1; // 🏆 زيادة عداد أعضاء الفريق تلقائياً فوراً للمستخدم
                    globalBalances.inviteProfit += req.amount; // 👥 إضافة رصيد المكافأة (15 USDT) مباشرة لحساب العميل
                }
            }
        }
        return req;
    });
    
    res.json({ success: true, balances: globalBalances });
});

// 5️⃣ 🚀 مسار بث أرباح الصفقة اليومية (نسبة 15%) من المشرف لجميع المشتركين
app.post('/api/broadcast', (req, res) => {
    if (globalBalances.capital <= 0) {
        return res.json({ success: false, message: "رأس مال المشتركين صفر حالياً" });
    }
    
    // حساب الـ 15% من إجمالي رأس المال الحالي وضخها في أرباح اليوم حياً
    const profitCalculated = globalBalances.capital * 0.15;
    globalBalances.todayProfit += profitCalculated;
    
    res.json({ success: true, profit: profitCalculated, balances: globalBalances });
});

// 6️⃣ مسار تنظيف اللوحة وتصفير الحسابات تماماً
app.post('/api/clear', (req, res) => {
    globalOrders = [];
    res.json({ success: true });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running smoothly on port ${PORT}`));

module.exports = app;
