# Explorify Backend Server with Razorpay & MySQL

This is the backend server for Explorify, providing user authentication and secure Razorpay payment integration.

## 🚀 Quick Start

### 1. Install Dependencies
Open terminal inside the `backend` folder:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables (`backend/.env`)
Edit `backend/.env` with your MySQL credentials and Razorpay API Keys:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=Explorify

# Razorpay API Keys from https://dashboard.razorpay.com -> Settings -> API Keys
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
```

### 3. Start the Server
```bash
npm start
# Or for auto-restart on changes:
npm run dev
```

---

## 💳 Razorpay Payment API Endpoints

### 1. Create Razorpay Order
- **Endpoint:** `POST /api/payment/create-order`
- **Body:**
```json
{
  "amount": 299.00,
  "appOrderId": "ORD12345678",
  "userId": 1,
  "userEmail": "user@example.com",
  "items": [ ... ],
  "shippingAddress": "123 Main St, Bengaluru"
}
```
- **Response:**
```json
{
  "success": true,
  "keyId": "rzp_test_...",
  "orderId": "order_XXXXXX",
  "amount": 29900,
  "currency": "INR",
  "appOrderId": "ORD12345678"
}
```

### 2. Verify Payment Signature (HMAC-SHA256)
- **Endpoint:** `POST /api/payment/verify-payment`
- **Body:**
```json
{
  "razorpay_order_id": "order_XXXXXX",
  "razorpay_payment_id": "pay_YYYYYY",
  "razorpay_signature": "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
  "appOrderId": "ORD12345678"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Payment verified and captured successfully",
  "paymentId": "pay_YYYYYY",
  "orderId": "order_XXXXXX"
}
```
