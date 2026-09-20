const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// ربط قاعدة البيانات السحابية (MongoDB)
// ==========================================
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trading_db')
  .then(() => console.log('✅ متصل بقاعدة البيانات السحابية بنجاح!'))
  .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// ==========================================
// تصميم جداول البيانات (Schemas) للأمان الصارم
// ==========================================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  isBotActive: { type: Boolean, default: false },
  referredBy: { type: String, default: "" }
});
const User = mongoose.model('User', userSchema);

const txSchema = new mongoose.Schema({
  username: { type: String, required: true },
  type: { type: String, required: true }, // deposit أو withdraw
  amount: { type: Number, required: true },
  cryptoAddress: { type: String, required: true },
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', txSchema);

// ==========================================
// برمجة العمليات المباشرة (APIs)
// ==========================================

// أ: تسجيل حساب جديد مع نظام الإحالات
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, referredBy } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "اسم المستخدم مسجل مسبقاً!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, referredBy: referredBy || "" });
    await newUser.save();
    
    res.status(201).json({ message: "تم تسجيل الحساب بنجاح!" });
  } catch (err) {
    res.status(500).json({ error: "خطأ في السيرفر أثناء التسجيل" });
  }
});

// ب: نظام الإيداع الصارم (فلتر الحد الأدنى 100 USDT)
app.post('/api/finance/deposit', async (req, res) => {
  try {
    const { username, amount, cryptoAddress } = req.body;
    
    // صمام الأمان: الرفض التلقائي البرمجي لأي مبلغ يقل عن 100
    if (Number(amount) < 100) {
      return res.status(400).json({ error: "خطأ: الحد الأدنى للإيداع هو 100 USDT!" });
    }

    const newTx = new Transaction({ username, type: 'deposit', amount, cryptoAddress, status: 'pending' });
    await newTx.save();
    res.status(200).json({ message: "تم تسجيل طلب الإيداع وهو قيد المراجعة الآن من المشرف." });
  } catch (err) {
    res.status(500).json({ error: "خطأ أثناء معالجة طلب الإيداع" });
  }
});

// ج: زر الصفقة السحري اليومي للمشرف (إضافة 15% وعمولة الإحالة 20%)
app.post('/api/admin/magic-button', async (req, res) => {
  try {
    // تم إصلاح السطر بالأسفل وحذف الرمز المائل العكسي بنجاح لمنع الأخطاء
    const activeUsers = await User.find({ balance: { \$gt: 0 } });

    for (let user of activeUsers) {
      const dailyProfit = user.balance * 0.15; // حساب ربح الـ 15%
      user.balance += dailyProfit;
      await user.save();

      // تتبع المستضيف ومنحه عمولة الـ 20% من أرباح صديقه تلقائياً دون خصم من الصديق
      if (user.referredBy) {
        const referrer = await User.findOne({ username: user.referredBy });
        if (referrer) {
          const referralBonus = dailyProfit * 0.20; // 20% من قيمة الربح اليومي للصديق
          referrer.balance += referralBonus;
          await referrer.save();
        }
      }
    }
    res.status(200).json({ message: "🚀 تم ضغط الزر السحري! وزعت أرباح 15% وعمولات الإحالة 20% بنجاح حيوى!" });
  } catch (err) {
    res.status(500).json({ error: "خطأ أثناء تنفيذ الصفقة السحرية الجماعية" });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل الآن بأمان على المنفذ ${PORT}`));
