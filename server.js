const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ربط قاعدة البيانات السحابية
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/trading_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ DB Error:', err));

// جداول البيانات
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  isBotActive: { type: Boolean, default: false }
});
const User = mongoose.model('User', userSchema);

const txSchema = new mongoose.Schema({
  username: { type: String, required: true },
  type: { type: String, default: 'deposit' },
  amount: { type: Number, required: true },
  cryptoAddress: { type: String, required: true },
  status: { type: String, default: 'pending' }
});
const Transaction = mongoose.model('Transaction', txSchema);

// المسارات البرمجية (APIs)
app.get('/', (req, res) => {
  res.send('🚀 السيرفر المركزي يعمل بأمان وبنجاح كامل!');
});

app.post('/api/finance/deposit', async (req, res) => {
  try {
    const { username, amount, cryptoAddress } = req.body;
    let user = await User.findOne({ username });
    if (!user) { user = new User({ username, password: "123" }); await user.save(); }
    
    const newTx = new Transaction({ username, amount: Number(amount), cryptoAddress });
    await newTx.save();
    res.status(200).json({ message: "تم تسجيل طلب الإيداع بنجاح في قاعدة البيانات." });
  } catch (err) { res.status(500).json({ error: "خطأ في السيرفر" }); }
});

app.get('/api/admin/requests', async (req, res) => {
  try {
    const pending = await Transaction.find({ status: 'pending' });
    res.json(pending);
  } catch (err) { res.status(500).json({ error: "خطأ" }); }
});

app.post('/api/admin/action', async (req, res) => {
  try {
    const { id, action } = req.body;
    const tx = await Transaction.findById(id);
    if (tx && action === 'approve') {
      tx.status = 'approved'; await tx.save();
      const user = await User.findOne({ username: tx.username });
      if (user) { user.balance += tx.amount; user.isBotActive = true; await user.save(); }
    }
    res.json({ message: "ok" });
  } catch (err) { res.status(500).json({ error: "خطأ" }); }
});

app.post('/api/admin/magic-button', async (req, res) => {
  try {
    const allUsers = await User.find({});
    for (let u of allUsers) {
      if(u.balance > 0) {
        u.balance += (u.balance * 0.15); await u.save();
      }
    }
    res.json({ message: "ok" });
  } catch (err) { res.status(500).json({ error: "خطأ" }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('🚀 Server is running'));
