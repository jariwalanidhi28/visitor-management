# Visitor & Employee Management System (VisitorFlow)

A full-stack, enterprise-grade Visitor & Employee Check-In & Geo-Verification System featuring:
- **Admin Web Console**: React 19 + Vite + Tailwind CSS with live attendance tables, structured location coordinates, and audit logs.
- **Mobile App**: React Native (Expo SDK 54) with camera selfie capture, geolocation tracking, and server IP switching.
- **Backend API**: Node.js + Express 5 with MongoDB / Mongoose, reverse geocoding, and JWT authentication.
- **Dual Tracking Engines**: Native Geocoding (OpenStreetMap / Google Maps) and HyperTrack SDK support.

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **MongoDB** running locally on port 27017 (or MongoDB Atlas connection string)

### 2. Install & Start Backend + Admin Web
```bash
# Install dependencies
npm run install:all

# Import demo database records (admin & attendance data)
cd backend
npm run db:import

# Run Backend (Port 5000) & Admin Web (Port 5173)
npm run dev
```

### 3. Run Mobile App (Expo)
```bash
cd mobile
npm install
npx expo start
```

---

## 🌐 Deploy to Render (Single Service)

This repository is pre-configured for 1-click deployment on [Render](https://render.com) (serves both API and Admin Web):

1. Create a **New Web Service** on Render and connect this repository: `https://github.com/nidhijariwala28/visitor-management.git`
2. Configure settings:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: *Your MongoDB Atlas connection URI*
   - `JWT_SECRET`: *Your secure JWT secret key*

---

## 📱 Mobile Production Build (Android APK)
Build preview APK directly using EAS:
```bash
cd mobile
set EAS_NO_VCS=1
eas build -p android --profile preview
```

---

## 👥 Default Credentials
- **Admin Portal**: `admin@visitor.local` / `Admin@123456`
- **Employee Mobile**: `jariwalanidhi28@gmail.com` / `nidhi123`
"# visitor-management" 
"# visitor-management" 
