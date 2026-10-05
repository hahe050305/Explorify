# 💳 Razorpay Integration & Complete Architectural Flow Guide

Welcome to the complete guide on how Razorpay payment integration works in **Explorify** (React Native + Node.js + MySQL).

---

## 📌 Table of Contents
1. [High-Level Payment Architecture & Flow](#1-high-level-payment-architecture--flow)
2. [Why Client-Only Payment is Dangerous (Security First)](#2-why-client-only-payment-is-dangerous)
3. [Step-by-Step Payment Flow Walkthrough](#3-step-by-step-payment-flow-walkthrough)
4. [Backend Implementation Overview (`backend/`)](#4-backend-implementation-overview)
5. [Frontend Implementation Overview (`src/`)](#5-frontend-implementation-overview)
6. [How to Get Razorpay Test Keys](#6-how-to-get-razorpay-test-keys)
7. [Installation & Setup Instructions](#7-installation--setup-instructions)
8. [Test Payment Credentials for Testing](#8-test-payment-credentials)

---

## 1. High-Level Payment Architecture & Flow

A secure payment gateway follows a **3-Party Handshake**:
1. **Your Mobile App (Explorify Client)**
2. **Your Backend Server (Node.js / Express in `backend/`)**
3. **Razorpay Servers & Checkout SDK**

```
+-------------+              +-----------------+              +------------------+
| Mobile App  |              | Backend Server  |              | Razorpay Servers |
| (Explorify) |              |  (Node/Express) |              |                  |
+------+------+              +--------+--------+              +--------+---------+
       |                              |                                |
       | 1. Click "Pay with Razorpay" |                                |
       |----------------------------->|                                |
       |                              | 2. Create Order (amount/paise) |
       |                              |------------------------------->|
       |                              |                                |
       |                              | 3. Returns order_id            |
       |                              |<-------------------------------|
       |                              |                                |
       | 4. Returns order_id & key_id |                                |
       |<-----------------------------|                                |
       |                                                               |
       | 5. Opens Razorpay Native Checkout Modal                       |
       |-------------------------------------------------------------->|
       |                                                               |
       | 6. Customer completes payment (UPI / Card / NetBanking)       |
       |                                                               |
       | 7. Returns (payment_id, order_id, signature)                  |
       |<--------------------------------------------------------------|
       |                                                               |
       | 8. POST /api/payment/verify-payment                           |
       |----------------------------->|                                |
       |                              | 9. HMAC-SHA256 Verification    |
       |                              |    using KEY_SECRET            |
       |                              | 10. Update DB status = 'paid'  |
       | 11. Payment Confirmed (200)  |                                |
       |<-----------------------------|                                |
       |                                                               |
       | 12. Clear Cart & Navigate to Order Placed Screen              |
       v                                                               v
```

---

## 2. Why Client-Only Payment is Dangerous

> [!CAUTION]
> **Never verify payments on the mobile app or trust the client alone!**
> 
> If you only checked `payment_id` on the mobile app:
> - A malicious user could use a proxy tool (e.g., Charles Proxy or Burp Suite) to forge a fake success response.
> - An attacker could alter the price on their phone (e.g. paying ₹1 for an item worth ₹10,000).
>
> **The Golden Rules of Payment Security:**
> 1. **Price calculation happens on backend:** The backend dictates the final price charged to the Razorpay order.
> 2. **Never expose `RAZORPAY_KEY_SECRET` in client code:** The Secret key is only stored on your server in `backend/.env`. The client only ever knows the public `RAZORPAY_KEY_ID`.
> 3. **Cryptographic Verification:** Razorpay creates a digital signature using your `KEY_SECRET`. Only your server (which holds the matching secret) can verify that Razorpay actually authorized the transaction.

---

## 3. Step-by-Step Payment Flow Walkthrough

### Step 1: Order Creation (Backend)
- When the user presses **"Pay with Razorpay"**, the mobile app sends the cart total and user info to `POST /api/payment/create-order`.
- **Amount Conversion:** Razorpay works in the smallest currency unit. In India, **1 INR = 100 paise**.
  - Example: ₹250.00 $\rightarrow$ `25000` paise.
- Backend calls Razorpay:
  ```javascript
  const order = await razorpay.orders.create({
    amount: 25000,
    currency: 'INR',
    receipt: 'ORD12345678',
  });
  ```
- Razorpay returns an official `order_id` (e.g. `order_DBJOWzybf0sJbb`).
- The backend records this pending order in MySQL and sends `order_id` + `keyId` to the mobile app.

### Step 2: Checkout Launch (Client)
- Mobile app passes `order_id`, `amount`, `currency`, and `key` to `RazorpayCheckout.open(options)`.
- Razorpay presents its native checkout sheet (supporting Google Pay, PhonePe, Paytm, Cards, UPI, Netbanking).

### Step 3: Payment Verification (Backend)
- After the user approves the payment, Razorpay returns 3 values to the app:
  1. `razorpay_order_id`
  2. `razorpay_payment_id`
  3. `razorpay_signature`
- The mobile app sends these to `POST /api/payment/verify-payment`.
- The backend computes:
  ```javascript
  const crypto = require('crypto');
  const payload = order_id + '|' + payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  ```
- If `expectedSignature === razorpay_signature`, the payment is authentic!
- Backend updates order status to `'paid'` in MySQL and returns `{ success: true }`.
- Client clears the cart and navigates to `OrderPlacedScreen`.

---

## 4. Backend Implementation Overview (`backend/`)

| File | Purpose |
| :--- | :--- |
| `backend/package.json` | Dependencies: `express`, `cors`, `dotenv`, `mysql2`, `razorpay` |
| `backend/.env` | Database credentials & Razorpay API keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) |
| `backend/db.js` | MySQL pool setup + auto-creates `users` and `orders` tables |
| `backend/razorpay.js` | Razorpay SDK wrapper, paise conversion, HMAC-SHA256 signature verification |
| `backend/routes/payment.js` | Express endpoints: `/create-order`, `/verify-payment`, `/webhook`, `/config` |
| `backend/routes/auth.js` | User authentication routes (`signup`, `signin`, `users`) |
| `backend/index.js` | Express server entry point running on port 5000 |

---

## 5. Frontend Implementation Overview (`src/`)

| File | Purpose |
| :--- | :--- |
| `src/config/api.ts` | Added `CREATE_ORDER` and `VERIFY_PAYMENT` API endpoints |
| `src/services/razorpayService.ts` | Orchestrates order creation, native checkout sheet, and signature verification with fallback simulation for dev |
| `src/screens/CartScreen.tsx` | "Pay with Razorpay" button with processing loader, initiates checkout and clears cart |
| `src/screens/OrderPlacedScreen.tsx` | Receives and passes `paymentId` and `paymentMethod` |
| `src/screens/OrderSummaryScreen.tsx` | Displays Payment Details card with `PAID` badge, payment method, and Transaction ID |
| `android/app/proguard-rules.pro` | Added ProGuard rules for Razorpay checkout |

---

## 6. How to Get Razorpay Test Keys

1. Go to **[https://dashboard.razorpay.com](https://dashboard.razorpay.com)** and sign up / log in.
2. In the top navigation bar, ensure **"Test Mode"** is selected (it will say **Test Mode** in an orange pill).
3. In the left sidebar, navigate to:
   **Account & Settings** $\rightarrow$ **API Keys** (under *Developer Controls*).
4. Click **Generate Test Key**.
5. You will see:
   - **Key ID:** Starts with `rzp_test_...`
   - **Key Secret:** A 24-character secret string.
6. Copy both into your `backend/.env` file:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YourKeyHere
   RAZORPAY_KEY_SECRET=YourSecretHere
   ```

---

## 7. Installation & Setup Instructions

### 1. Set up the Backend
```bash
cd backend
npm install
npm start
```
*(The backend server will run on `http://localhost:5000` / `http://10.0.2.2:5000` for Android).*

### 2. Set up the Mobile App (React Native)
In the root project directory:
```bash
# 1. Install Razorpay React Native SDK
npm install react-native-razorpay

# 2. Rebuild Android app (so native module links)
npm run android
```

> [!NOTE]
> Even before you install `react-native-razorpay` or rebuild the native Android app, the app includes an automatic fallback dev simulator so you can test the backend database insertion, cart clearing, and navigation flow immediately!

---

## 8. Test Payment Credentials (In Test Mode)

When Razorpay Checkout opens in **Test Mode**, you can use these test details without spending real money:

| Method | Test Details |
| :--- | :--- |
| **UPI** | `success@razorpay` (or click "Instant Pay" on simulator) |
| **Card (Success)** | Number: `4111 1111 1111 1111`, Expiry: `12/30`, CVV: `123`, OTP: `123456` |
| **Card (Failure)** | Number: `4000 0000 0000 0002`, Expiry: `12/30`, CVV: `123` |
| **Netbanking** | Select **HDFC Bank** or **ICICI Bank** $\rightarrow$ Click **Success** on the Razorpay test screen |
