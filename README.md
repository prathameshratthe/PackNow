# PackNow - On-Demand Professional Packaging Service

> A comprehensive full-stack platform connecting users with professional packers for secure, on-demand packaging services at their doorstep.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)
![React 18](https://img.shields.io/badge/React-18-blue.svg)

## 🌟 Overview

PackNow is a solution designed to simplify the process of packaging items securely. Whether it's a fragile gift, important documents, or electronics, users can request a professional "Packer" to arrive at their location, equipped with the exact materials needed to safely pack their items for shipping. 

The architecture is built heavily around **three distinct, isolated roles** with their own dashboards, ensuring data security and role-specific workflows.

---

## 👥 Three Isolated Roles

PackNow features three completely separated interfaces, preventing cross-role access and ensuring a streamlined experience for each user type.

### 1. 👤 The Customer (User)
* **URL:** `/dashboard`
* **Theme:** Light mode, user-friendly aesthetic.
* **Capabilities:** 
  * Register and authenticate via Email OTP.
  * Estimate order prices instantly using real-world map coordinates (Pickup to Dropoff).
  * Request a Packer by selecting the item category, dimensions, and urgency.
  * View tracking history and real-time order status updates.
  * Provide a secure **Delivery OTP** to the Packer to confirm the service is completed.

### 2. 🧰 The Professional (Packer)
* **URL:** `/packer/dashboard`
* **Theme:** Warm, action-oriented aesthetic.
* **Capabilities:** 
  * Manage real-time inventory of packaging materials (Bubble wrap, boxes, tape, etc.).
  * Go "Online" to receive nearby packing requests.
  * Accept orders based on required materials and distance.
  * Update order tracking statuses (En Route, Arrived, Packing, Completed).
  * Complete orders by verifying the Customer's Delivery OTP.

### 3. 🛡️ The Administrator (Admin)
* **URL:** `/admin/login`
* **Theme:** Strict, data-heavy dashboard.
* **Authentication:** Hardcoded, ultra-secure admin secret key (`ADMIN_SECRET_KEY`). Total isolation from the regular JWT user pool.
* **Capabilities:** 
  * View global system metrics (Total Revenue, Active Users, Pending Orders).
  * Manage all user and packer accounts (Suspend, Delete, View).
  * Oversee all orders from a high level.
  * Monitor system health.

---

## 🚀 Key Technical Features

- **Free, Reliable Authentication (Email OTP):** Migrated from paid SMS (Twilio) to a 100% free **Email OTP** system using the Resend Python SDK, ensuring high deliverability without recurring API costs.
- **Fair & Real-time Dynamic Pricing:** Integrated **OpenStreetMap (Nominatim API)** on the frontend to geocode raw text addresses into real latitude/longitude coordinates. Prices are dynamically and deterministically calculated based on the precise straight-line distance from the *Pickup* to the *Dropoff* location, item dimensions, fragility, and urgency.
- **Intelligent Dispatch System:** The backend dispatcher calculates distances using the Haversine formula and only matches orders to Packers who are within the search radius AND have sufficient material inventory to complete the job.
- **Robust Security:** Implemented role-based JWT authentication, password hashing (bcrypt), and strict endpoint isolation.

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python async web framework.
- **PostgreSQL** - Primary relational database.
- **SQLAlchemy** - ORM for secure database operations.
- **Resend SDK** - For reliable Email OTP delivery.

### Frontend
- **React 18** - Modern UI library.
- **Tailwind CSS** - Utility-first styling for rapid UI development.
- **Vite** - Lightning-fast build tool.
- **Axios** - Intercepted HTTP client for JWT management.

---

## 📋 Local Setup & Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL database

### Environment Variables
**Backend (`backend/.env`):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/packnow
SECRET_KEY=your_super_secret_jwt_key
ADMIN_SECRET_KEY=your_secure_admin_password
RESEND_API_KEY=re_your_resend_api_key
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Running Locally

**1. Start the Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**2. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Live Deployment
* **Frontend:** Hosted on Vercel
* **Backend:** Hosted on Render (Web Service)
* **Database:** Managed PostgreSQL on Render

*(For detailed deployment instructions, refer to `DEPLOYMENT.md` or `walkthrough.md`)*

---
**Made with ❤️ for VII semester project**
