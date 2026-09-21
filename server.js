const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// ربط قاعدة البيانات السحابية مباشرة وبأمان
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trading_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ متصل بقاعدة البيانات السحابية بنجاح!'))
  .catch(err => console.error('❌ خطأ قاعدة البيانات:', err));

// ==========================================
// تصميم جداول البيانات (Schemas)
// ==========================================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  isBotActive: { type: Boolean, default: false },
  referredBy: { type: String, default: "" }
});
const User = mongoose.model('User', userSchema);

const txSchema = new mongoose.Schema({
  username: { type: String, required: true },
  type: { type: String, required: true }, 
  amount: { type: Number, required: true },
  cryptoAddress: { type: String, required: true },
  status: { type: String, default: 'pending' }, 
  createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', txSchema);

// ==========================================
// واجهة المشتركين المدمجة تلقائياً (index)
// ==========================================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>منصة التداول الذكية - حساب المشترك</title>
        <link rel="stylesheet" href="https://cloudflare.com">
        <style>body { font-family: sans-serif; background-color: #0b0f19; color: #f3f4f6; }</style>
    </head>
    <body class="p-4 bg-gray-900">
        <div class="max-w-md mx-auto space-y-6 mt-4">
            <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl text-center">
                <h1 class="text-xl font-bold text-blue-400 mb-2">🚀 مرحباً بك في منصة التداول</h1>
                <p class="text-gray-400 text-sm">رصيدك الحالي المحدث حياً:</p>
                <div class="text-3xl font-extrabold text-green-400 mt-1">0.00 USDT</div>
                <div class="inline-block mt-3 px-3 py-1 bg-gray-700 text-xs rounded-full text-yellow-400">🤖 البوت: مستعد للإيداع</div>
            </div>
            <div class="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                <h2 class="text-lg font-bold text-yellow-500 mb-4">💰 طلب تفعيل وإيداع رصيد</h2>
                <div class="bg-gray-900 p-3 rounded-xl border border-gray-700 mb-4 text-center">
                    <p class="text-xs text-gray-400 mb-1">عنوان محفظة الشركة الرسمي (USDT TRC-20):</p>
                    <div class="bg-black p-2 rounded-lg text-xs font-mono text-yellow-400 break-all select-all">TA1vsgrJEFy3YM6rkQWBppnZemFE6c9pBN</div>
                </div>
                <p class="text-xs text-gray-400 mb-4">تنبيّه: الحد الأدنى للإيداع هو <span class="text-yellow-500 font-bold">100 USDT</span>.</p>
                <div class="space-y-3">
                    <input type="text" id="username" placeholder="اسم المستخدم" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none">
                    <input type="number" id="amount" placeholder="المبلغ (USDT)" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none">
                    <input type="text" id="address" placeholder="محفظتك الشخصية" class="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none">
                    <button onclick="sendDeposit()" class="w-full bg-yellow-500 text-black font-bold p-3 rounded-xl">إرسال طلب الإيداع للمراجعة</button>
                </div>
                <div id="msg" class="text-xs mt-3 text-center font-bold"></div>
            </div>
        </div>
        <script>
            async function sendDeposit() {
                const username = document.getElementById('username').value;
                const amount = document.getElementById('amount').value;
                const cryptoAddress = document.getElementById('address').value;
                const msg = document.getElementById('msg');
                if(!username || !amount || !cryptoAddress) { msg.className="text-red-400"; msg.innerText="❌ امشأ كل الحقول!"; return; }
                if(amount < 100) { msg.className="text-red-400"; msg.innerText="❌ الحد الأدنى 100 USDT"; return; }
                try {
                    const res = await fetch('/api/finance/deposit', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ username, amount, cryptoAddress })
                    });
                    const data = await res.json();
                    msg.className = res.ok ? "text-green-400" : "text-red-400";
                    msg.innerText = res.ok ? "✅ " + data.message : "❌ " + data.error;
                } catch(e) { msg.className="text-red-400"; msg.innerText="❌ خطأ في السيرفر"; }
            }
        </script>
    </body>
    </html>
  `);
});

// ==========================================
// لوحة تحكم المشرف المدمجة تلقائياً (admin)
// ==========================================
app.get('/admin-panel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>لوحة التحكم المركزية</title>
        <link rel="stylesheet" href="https://cloudflare.com">
        <style>body { font-family: sans-serif; background-color: #060b13; color: #f3f4f6; }</style>
    </head>
    <body class="p-4 bg-black" onload="loadRequests()">
        <div class="max-w-2xl mx-auto space-y-6 mt-4">
            <div class="bg-gray-900 p-6 rounded-2xl border border-red-900 text-center">
                <h1 class="text-xl font-bold text-red-400">🛡️ غرفة التحكم والمراقبة لـ ملايين المشتركين</h1>
            </div>
            <div class="bg-gray-900 p-6 rounded-2xl border border-gray-800 text-center space-y-4">
                <h2 class="text-lg font-bold text-yellow-400">⚡ زر الصفقة السحري اليومي (15%)</h2>
                <button onclick="triggerMagic()" id="mBtn" class="w-full bg-yellow-500 text-black font-bold p-4 rounded-xl">🚀 ضخ أرباح الـ 15% وعمولات الـ 20%</button>
                <div id="mStatus" class="text-xs text-yellow-400"></div>
            </div>
            <div class="bg-gray-900 p-6 rounded-2xl border border-gray-800">
                <h2 class="text-md font-bold text-gray-400 mb-4">📑 طلبات الإيداع الحية من قاعدة البيانات</h2>
                <div id="list" class="space-y-3 text-sm"></div>
            </div>
        </div>
        <script>
            async function loadRequests() {
                const list = document.getElementById('list');
                try {
                    const res = await fetch('/api/admin/requests');
                    const data = await res.json();
                    if(data.length === 0) { list.innerHTML = '<p class="text-gray-500 text-center">🟢 لا توجد طلبات معلقة.</p>'; return; }
                    list.innerHTML = '';
                    data.forEach(req => {
                        list.innerHTML += \`
                            <div class="p-4 bg-black rounded-xl border border-gray-800 flex justify-between items-center">
                                <div>
                                    <p class="text-yellow-400 font-bold">👤 العميل: \${req.username}</p>
                                    <p class="text-green-400 font-bold">💰 المبلغ: \${req.amount} USDT</p>
                                </div>
                                <button onclick="approve('\${req._id}')" class="bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-xs">موافقة وتحديث الحساب</button>
                            </div>
                        \`;
                    });
                } catch(e) { list.innerHTML = '<p class="text-red-400">خطأ في جلب البيانات</p>'; }
            }
            async function approve(id) {
                await fetch('/api/admin/action', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ id, action: 'approve' })
                });
                alert('✅ تم شحن حساب العميل وتنشيط البوت بنجاح حقيقي!');
                loadRequests();
            }
            async function triggerMagic() {
                document.getElementById('mStatus').innerText = "جاري الحساب والضخ...";
                await fetch('/api/admin/magic-button', { method: 'POST' });
                document.getElementById('mStatus').innerText = "✅ نجح ضخ الأرباح والعمولات للملايين!";
            }
            setInterval(loadRequests, 4000);
        </script>
    </body>
    </html>
  `);
});

// ==========================================
// برمجة المسارات الخلفية (APIs)
// ==========================================
app.post('/api/finance/deposit', async (req, res) => {
  try {
    const { username, amount, cryptoAddress } = req.body;
    let user = await User.findOne({ username });
    if (!user) { user = new User({ username, password: "123" }); await user.save(); }
    const newTx = new Transaction({ username, type: 'deposit', amount: Number(amount), cryptoAddress });
    await newTx.save();
    res.status(200).json({ message: "تم تسجيل طلب الإيداع وهو في لوحة التحكم الآن." });
    
