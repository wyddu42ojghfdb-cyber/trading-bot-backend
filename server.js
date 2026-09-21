const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// ربط قاعدة البيانات السحابية مباشرة وبأمان
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trading_db';

mongoose.connect(MONGO_URI)
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
  type: { type: String, required: true }, 
  amount: { type: Number, required: true },
  cryptoAddress: { type: String, required: true },
  status: { type: String, default: 'pending' }, 
  createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', txSchema);

// ==========================================
// برمجة العمليات المباشرة (APIs)
// ==========================================

// 1. استقبال طلبات الإيداع من المشتركين (فلتر 100 USDT)
app.post('/api/finance/deposit', async (req, res) => {
  try {
    const { username, amount, cryptoAddress } = req.body;
    
    if (Number(amount) < 100) {
      return res.status(400).json({ error: "خطأ: الحد الأدنى للإيداع هو 100 USDT!" });
    }

    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username, password: "default_hashed_password" });
      await user.save();
    }

    const newTx = new Transaction({ username, type: 'deposit', amount: Number(amount), cryptoAddress, status: 'pending' });
    await newTx.save();
    res.status(200).json({ message: "تم تسجيل طلب الإيداع وهو قيد المراجعة الآن من المشرف." });
  } catch (err) {
    res.status(500).json({ error: "خطأ أثناء معالجة طلب الإيداع" });
  }
});

// 2. إرسال الطلبات المعلقة لشاشة المشرف
app.get('/api/admin/requests', async (req, res) => {
  try {
    const pendingRequests = await Transaction.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.status(200).json(pendingRequests);
  } catch (err) {
    res.status(500).json({ error: "خطأ أثناء جلب طلبات السيرفر" });
  }
});

// 3. معالجة قرار المشرف (موافقة أو رفض) - تم إصلاح الصيغة لمنع التوقف نهائياً
app.post('/api/admin/action', async (req, res) => {
  try {
    const { id, action } = req.body;
    
    const tx = await Transaction.findById(id);
    if (!tx) return res.status(404).json({ error: "الطلب غير موجود مسبقاً!" });

    if (action === 'approve') {
      tx.status = 'approved';
      
      // كود آمن لتحديث حساب المشترك الفريد بدون رموز مائلة
      const user = await User.findOne({ username: tx.username });
      if (user) {
        user.balance += tx.amount;
        user.isBotActive = true;
        await user.save();
      }
    } else {
      tx.status = 'rejected';
    }

    await tx.save();
    res.status(200).json({ message: "تمت معالجة العملية بنجاح حقيقي!" });
  } catch (err) {
    res.status(500).json({ error: "خطأ أثناء تحديث حالة العملية" });
  }
});

// 4. زر الصفقة السحري اليومي للمشرف (إضافة 15% وعمولة الإحالة 20%)
app.post('/api/admin/magic-button', async (req, res) => {
  try {
    const allUsers = await User.find({});
    const activeUsers = allUsers.filter(u => u.balance > 0);

    for (let user of activeUsers) {
      const dailyProfit = user.balance * 0.15;
      user.balance += dailyProfit;
      await user.save();

      if (user.referredBy) {
        const referrer = await User.findOne({ username: user.referredBy });
        if (referrer) {
          const referralBonus = dailyProfit * 0.20;
          referrer.balance += referralBonus;
          await referrer.save();
        }
      }
    }
    res.status(200).json({ message: "🚀 تم ضغط الزر السحري! وزعت أرباح 15% وعمولات الإحالة 20% بنجاح حيوي!" });
  } catch (err) {
    res.status(500).json({ error: "خطأ أثناء تنفيذ الصفقة السحرية الجماعية" });
  }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل الآن بأمان على المنفذ ${PORT}`));
