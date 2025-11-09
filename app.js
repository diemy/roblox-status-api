const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
let reports = [];

// Kiểm tra server
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Nhận dữ liệu từ Roblox
app.post("/report", (req, res) => {
  const body = req.body;
  reports.push({ ...body, time: new Date().toISOString() });
  res.json({ success: true, received: body });
});

// Xem tất cả report đã nhận
app.get("/reports", (req, res) => {
  res.json(reports);
});

app.listen(PORT, () => console.log(`✅ Private Status API running on ${PORT}`));
