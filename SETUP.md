# CityFix - Professional AI-Powered City Management Platform

## 🚀 Complete Setup Guide

This is a comprehensive guide to set up and run the CityFix platform - a cutting-edge city management system powered by AI.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Key Features Implemented](#key-features-implemented)

## ✨ Features

### Core Features
- **AI-Powered Image Analysis** - Automatic problem detection using GPT-4 Vision
- **Professional Chatbot** - Context-aware AI assistant in 3 languages
- **Smart Interactive Map** - Real-time problem visualization
- **Multi-language Support** - Arabic, Hebrew, and English
- **Role-Based Access Control** - 6 different user roles
- **My Impact Dashboard** - Track personal contributions
- **Advanced Analytics** - Data-driven insights
- **Real-time Updates** - Socket.io integration
- **Responsive Design** - Mobile, tablet, and desktop support

### User Roles
1. **Citizen** - Submit and track reports
2. **Employee** - Handle assigned tasks
3. **Supervisor** - Manage team members
4. **Department Manager** - Oversee department operations
5. **Municipality Admin** - Full municipality control
6. **Super Admin** - System-wide administration

## 🛠️ Tech Stack

### Frontend
- **React 18** with Hooks
- **Material-UI (MUI)** - Professional UI components
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **i18next** - Internationalization
- **Leaflet** - Interactive maps
- **Chart.js & Recharts** - Data visualization
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Vite** - Fast build tool

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & Mongoose** - Database
- **OpenAI GPT-4 Vision** - AI image analysis
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **AWS S3** - File storage
- **Redis** - Caching & rate limiting
- **Bull** - Job queue
- **Nodemailer** - Email service

## 📦 Prerequisites

- **Node.js** v16+ and npm
- **MongoDB** v5+
- **Redis** (optional, for production)
- **OpenAI API Key** (for AI features)
- **AWS Account** (optional, for S3 storage)

## 🔧 Installation

### 1. Clone the Repository
```bash
cd Project-Wep_CityFix
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. **Create Environment File**
```bash
cd server
cp .env.example .env
```

2. **Configure Environment Variables** (`server/.env`)
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/cityfix

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# OpenAI (Required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=cityfix-uploads

# Redis (Optional, for production)
REDIS_URL=redis://localhost:6379

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Configuration

1. **Create Environment File**
```bash
cd frontend
cp .env.example .env
```

2. **Configure Environment Variables** (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_MAPBOX_TOKEN=your-mapbox-token-here
```

## 🚀 Running the Application

### Development Mode

1. **Start MongoDB**
```bash
# Using MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. **Start Backend Server**
```bash
cd server
npm run dev
```
Backend will run on `http://localhost:5000`

3. **Start Frontend Development Server** (in a new terminal)
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

### Production Mode

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Start Backend in Production**
```bash
cd server
NODE_ENV=production npm start
```

## 📁 Project Structure

```
Project-Wep_CityFix/
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Layout/        # Navbar, Sidebar, Footer
│   │   │   ├── Chatbot/       # AI Chatbot component
│   │   │   ├── Auth/          # Authentication components
│   │   │   └── Common/        # Shared components
│   │   ├── pages/             # Page components
│   │   │   ├── Home/          # Landing page
│   │   │   ├── Auth/          # Login, Register
│   │   │   ├── Dashboard/     # User dashboard
│   │   │   ├── Reports/       # Reports management
│   │   │   ├── MyImpact/      # Personal impact tracking
│   │   │   ├── Analytics/     # Analytics dashboard
│   │   │   └── Settings/      # User settings
│   │   ├── store/             # Redux store
│   │   │   └── slices/        # Redux slices
│   │   ├── services/          # API services
│   │   ├── config/            # Configuration files
│   │   └── utils/             # Utility functions
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node.js Backend
│   ├── controllers/            # Route controllers
│   │   ├── aiController.js    # AI features
│   │   ├── authController.js  # Authentication
│   │   └── reportController.js # Reports management
│   ├── models/                # Mongoose models
│   │   ├── User.js
│   │   ├── Report.js
│   │   └── Analytics.js
│   ├── services/              # Business logic
│   │   ├── AIService.js       # AI integration
│   │   └── EmailService.js    # Email service
│   ├── middleware/            # Express middleware
│   ├── routes/                # API routes
│   ├── config/                # Configuration
│   └── server.js              # Entry point
│
├── client/                     # Original HTML client (legacy)
└── README.md
```

## 🎯 Key Features Implemented

### 1. AI Image Analysis
- **GPT-4 Vision Integration** - Automatic problem detection
- **Smart Categorization** - Auto-suggests category, priority, department
- **Severity Assessment** - Rates problem severity 1-10
- **Action Recommendations** - Suggests resolution steps

**Usage:**
1. Go to "Submit Report"
2. Upload an image
3. AI automatically analyzes and fills the form

### 2. Professional Chatbot
- **Multi-language Support** - AR, HE, EN
- **Role-based Responses** - Different AI behavior per user role
- **Context-aware** - Remembers conversation history
- **Quick Actions** - Pre-defined common queries

**Access:** Click the chat icon (bottom right)

### 3. Multi-language System
- **3 Languages** - Arabic (RTL), Hebrew (RTL), English (LTR)
- **Complete Translation** - All UI elements
- **Language Switcher** - In navbar
- **Auto-detection** - Browser language detection

### 4. Role-Based Access
- **6 User Roles** with different permissions
- **Protected Routes** - Role-based page access
- **Dynamic UI** - Shows only relevant features

### 5. My Impact Dashboard
- **Personal Stats** - Reports submitted, resolved
- **Impact Score** - Gamification system
- **Leaderboard** - Compare with other users
- **Badges & Achievements** - Reward system

### 6. Advanced Analytics
- **Charts & Graphs** - Visual data representation
- **Trend Analysis** - Historical data tracking
- **Export Data** - CSV/Excel export
- **Real-time Updates** - Live statistics

## 🔐 Default Users

### Admin Account
```
Email: admin5@gmail.com
Password: Admin123!
Role: SUPER_SUPER_ADMIN
```

### Citizen Account
```
Email: user1@test.com
Password: User123456
Role: CITIZEN
```

## 📱 Mobile App (React Native)

The project is structured to support React Native for mobile apps. Components are designed to be reusable across web and mobile platforms.

**To create mobile app:**
```bash
npx react-native init CityFixMobile
# Copy and adapt components from frontend/src/components
```

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create report
- `GET /api/reports/:id` - Get report by ID
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### AI Features
- `POST /api/ai/analyze-image` - Analyze image with AI
- `POST /api/ai/chatbot` - Chat with AI assistant

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/my-impact` - Get personal impact

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
```bash
# Make sure MongoDB is running
sudo systemctl status mongod
```

2. **OpenAI API Error**
- Check your API key in `.env`
- Ensure you have credits in your OpenAI account

3. **Port Already in Use**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

4. **Frontend Not Connecting to Backend**
- Check `VITE_API_URL` in `frontend/.env`
- Ensure backend is running on correct port

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary and confidential.

## 💬 Support

For support, email support@cityfix.com or open an issue in the repository.

---

**Built with ❤️ using React, Node.js, and OpenAI GPT-4**
