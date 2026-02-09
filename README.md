# PackNow - On-Demand Professional Packaging Service

> A full-stack web application connecting users with professional packers for secure packaging and shipping services.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication with password strength validation
- **Role-Based Access** - Separate portals for users and packers
- **Order Management** - Create, track, and manage packaging orders
- **Real-Time Pricing** - Dynamic pricing based on category, distance, and materials
- **Geolocation** - Automatic location detection for service availability
- **Security** - Rate limiting, CORS, security headers, OWASP compliance
- **Modern UI** - Responsive design with Toast notifications and animations

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **Redis** - Caching and session management
- **SQLAlchemy** - ORM for database operations
- **JWT** - Secure authentication
- **Docker** - Containerization

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool

## 📋 Prerequisites

- Docker & Docker Compose
- Git
- (Optional) Node.js 18+ and Python 3.11+ for local development

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/PackNow.git
cd PackNow

# Create environment file
cp backend/.env.example backend/.env

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Demo Credentials

**Packer Account:**
- Phone: +919876543210
- Password: packer123

**User Account:**
- Register a new account at http://localhost:3000/register

## 📁 Project Structure

```
PackNow/
├── backend/
│   ├── api/           # API routes and dependencies
│   ├── core/          # Configuration and security
│   ├── models/        # Database models
│   ├── schemas/       # Pydantic schemas
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Utility functions
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions on:
- Render (Free tier)
- Railway (Free tier)
- Vercel (Frontend)
- Netlify (Frontend)

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password strength validation (8+ chars, mixed case, digit, special char)
- ✅ Rate limiting (60 req/min per client)
- ✅ CORS protection
- ✅ Security headers (XSS, clickjacking, MIME sniffing protection)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (ORM)
- ✅ OWASP Top 10 compliance

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## 📚 API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation (Swagger UI).

### Key Endpoints

- `POST /api/v1/auth/register/user` - User registration
- `POST /api/v1/auth/login/user` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/orders` - List user orders
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders/{id}` - Get order details

## 🧪 Testing

**Backend:**
```bash
# Test registration
curl -X POST http://localhost:8000/api/v1/auth/register/user \
  -H "Content-Type: application/json" \
  -d @test_register.json

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login/user \
  -H "Content-Type: application/json" \
  -d @test_login.json
```

**Frontend:**
1. Navigate to http://localhost:3000
2. Create account with strong password
3. Test order creation flow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work*

## 🙏 Acknowledgments

- FastAPI documentation
- React documentation
- Tailwind CSS
- Docker

## 📞 Support

For support, email support@packnow.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Real-time order tracking
- [ ] Payment integration (Stripe/Razorpay)
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Multi-language support

---

**Made with ❤️ for VII semester project**
