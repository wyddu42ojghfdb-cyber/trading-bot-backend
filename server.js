const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

let orders = [];
let usersData = {};

app.get('/', (req, res) => {
    res.send('🚀 Sunucu Aktif ve Sorunsuz Çalışıyor!');
});

// 1. Kullanıcı kaydı (Register)
app.post('/api/register-user', (req, res) => {
    const { username } = req.body;
    if (username && !usersData[username]) {
        usersData[username] = { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 };
    }
    res.json({ success: true });
});

// 2. İstekleri Al (Receive Orders)
app.post('/api/orders', (req, res) => {
    const order = req.body;
    order.id = Date.now().toString();
    order.status = 'pending';
    orders.push(order);
    res.status(200).json({ success: true });
});

// 3. Yönetici Paneline İstekleri Gönder (Admin Orders)
app.get('/api/admin/orders', (req, res) => {
    res.json(orders);
});

// 4. Yönetici Paneline Kullanıcıları Gönder (Admin Users)
app.get('/api/admin/users-profits', (req, res) => {
    res.json(usersData);
});

// 5. Toplu %15 Kâr Dağıtımı (Distribute Profits)
app.post('/api/admin/distribute-profits', (req, res) => {
    let count = 0;
    for (let username in usersData) {
        const user = usersData[username];
        if (user.capital > 0) {
            user.todayProfit += user.capital * 0.15;
            count++;
        }
    }
    res.json({ success: true, message: `Başarıyla ${count} hesaba %15 kâr dağıtıldı!` });
});

// 6. Yönetici Kararı (Accept / Reject)
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

// 7. Kullanıcı Bilgisi Sorgulama (User Status)
app.get('/api/users/:username', (req, res) => {
    const username = req.params.username;
    res.json(usersData[username] || { capital: 0, todayProfit: 0, inviteProfit: 0, teamCount: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sunucu aktif.`));
