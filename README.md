# AI Market Analysis Platform

> **แพลตฟอร์มวิเคราะห์ตลาดการเงินอัจฉริยะ** - ผสานข้อมูล Real-time และ AI เพื่อการตัดสินใจที่แม่นยำยิ่งขึ้น

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20FastAPI%20%7C%20AI-blueviolet)

## ฟีเจอร์เด่น (Key Features)

### 1. Real-time Market Data
- **Live Prices**: แสดงราคา Crypto (BTC, ETH), หุ้นสหรัฐฯ (MAG7), และทองคำ (Gold) แบบ Real-time
- **Interactive Charts**: กราฟแท่งเทียนที่ตอบสนองไว พร้อม Indicator พื้นฐาน
- **Market Overview**: ดูภาพรวมตลาด Volume และ Market Cap ได้ทันที

### 2. Intelligent News Feed (New!)
- **Real-time News**: ดึงข่าวเศรษฐกิจล่าสุดจาก **Yahoo Finance**
- **Smart Display**: แสดงภาพข่าว (Thumbnail) และจัดเรียงตามเวลาล่าสุด
- **Sentiment Analysis**: (กำลังพัฒนา) วิเคราะห์อารมณ์ข่าวด้วย AI

### 3. AI Usage
- **Price Analysis**: ใช้ Technical Indicator (RSI, MACD) คำนวณสัญญาณซื้อขาย
- **Trend Prediction**: บอกแนวโน้มตลาด (Bullish/Bearish) ทั้งระยะสั้นและยาว

### 4. Modern UI/UX
- **Glassmorphism Design**: ดีไซน์กระจกฝ้า ทันสมัย สบายตา (Dark Mode)
- **Responsive**: ใช้งานได้ลื่นไหลทั้งบนคอมพิวเตอร์และมือถือ

---

## เทคโนโลยีเบื้องหลัง (Tech Stack)

| ส่วนประกอบ | เทคโนโลยี | รายละเอียด |
|------------|------------|------------|
| **Frontend** | Next.js 14 | React Framework, TypeScript, TailwindCSS |
| **Backend** | FastAPI | Python API ความเร็วสูง, WebSockets |
| **Data Source** | yfinance | ดึงข้อมูลตลาดและข่าวจาก Yahoo Finance |
| **Database** | (Coming Soon) | รองรับ PostgreSQL/Supabase |

---

## การติดตั้งและใช้งาน (Installation)

### 1. โคลนโปรเจกต์ (Clone)
```bash
git clone https://github.com/your-username/ai-market-analysis-platform.git
cd ai-market-analysis-platform
```

### 2. ตั้งค่า Backend (Python)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

### 3. ตั้งค่า Frontend (Node.js)
```bash
cd ../frontend
npm install
```

---

## วิธีรันโปรเจกต์ (Run)

ต้องเปิด Terminal 2 หน้าต่าง เพื่อรันทั้ง Backend และ Frontend

**Terminal 1: Backend**
```bash
cd backend
python main.py
# Server จะทำงานที่ http://localhost:8000
```

**Terminal 2: Frontend**
```bash
cd frontend
npm run dev
# เปิดเว็บได้ที่ http://localhost:3000
```

---

## โครงสร้างโปรเจกต์ (Structure)

```
/
├── backend/            # ระบบหลังบ้าน (API & AI Logic)
│   ├── src/api/       # Endpoints (Market, News, Signals)
│   └── main.py        # จุดเริ่มต้นของ Server
│
├── frontend/           # หน้าเว็บ (Next.js)
│   ├── src/app/       # หน้า Dashboard และ Routing
│   └── components/    # Components กราฟและการ์ดแสดงผล
│
└── ai-service/         # (Optional) Microservice สำหรับโมเดล AI ขั้นสูง
```

---

## หมายเหตุสำคัญ (Important Notes)
*   **วันเสาร์-อาทิตย์**: ตลาดหุ้นและทองคำปิดทำการ ราคาจะนิ่งที่ราคาปิดวันศุกร์ (เป็นปกติของ Real-time Data) ส่วน Crypto จะขยับตลอด 24 ชม.
*   **API Limits**: การดึงข้อมูลจำนวนมากอาจติด Rate Limit ของ Yahoo Finance ได้ (ระบบมี Caching ช่วยจัดการแล้ว)

---

พัฒนาด้วยความใส่ใจ โดย [ทีมพัฒนาของคุณ]
