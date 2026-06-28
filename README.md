<p align="center">
  <img src="./frontend-app/src/assets/logo1.jpeg?raw=true" width="450" />
</p>




---

## 1. Overview

POWER-GRID is a full-stack fault tracking and management system.  
Users can submit complaints with relevant information, and administrators can monitor, assign, and review issues from a single dashboard. The goal is to simplify fault logging, reduce repeated issues, and improve resolution time through clear analytics.

---

## 2. Problem Statement

**PS Number:** PS-09  

Fault reporting is typically poorly organized, often spread across WhatsApp messages, email threads, and verbal communication. This leads to:

- Repeated complaints  
- Delays in resolution  
- No visibility into issue trends  

POWER-GRID centralizes this entire workflow into one application.

---

## 3. Feature Implementation Summary

### 3.1 Basic Functionalities — Completed

- Login and role-based access  
- Raise new complaints  
- Assign engineers to issues  
- SLA timers  
- Comment thread on each issue  
- Status tracker (Open, Assigned, In-Progress, Resolved, Closed)  
- Dashboard with real-time stats  

### 3.2 Advanced Functionalities — Completed

- Email/SMS alerts  
- Multi-role access separation  
- Bulk operations on complaints  
- Real-time UI feedback  

### 3.3 Preferred Tech — Implemented

- React frontend  
- Node.js backend  
- MongoDB database  
- Redis cache and rate limiting  

### 3.4 Brownie Points 

- Docker support  
- Worker queue logic for heavy operations  
- Role-based dashboards  

---

## 4. Extra Features (Beyond Requirements)

- Cloudinary-based image uploads  
- Centralized error handling middleware  
- Rate limiter on both login and complaint submission  
- Redis caching on repeated requests  
- Search, pagination & filters  
- Engineer workload stats on dashboard  
- SLA breach counter  
- Priority levels for complaints  

---

## 5. Dashboard Statistics (Generated Automatically)

The system generates internal performance data such as:

- Total complaints  
- Status counts (Open, Assigned, Resolved, Closed)  
- Average resolution time  
- Engineer-wise complaint distribution  
- Daily / weekly / monthly complaint trends  
- SLA expired cases  
- Most frequent complaint categories  

---

## 6. Tech Stack

**Frontend**  
React, Tailwind CSS, ShadCN UI

**Backend**  
Node.js, Express.js, JWT Authentication

**Database & Cloud**  
MongoDB Atlas, Cloudinary, Redis



---

## 7. System Architecture

Frontend (React)
|
| REST API
|
Backend (Express + JWT)
|
| | |
MongoDB Redis Cloudinary

---

## 8. API Documentation (Short Overview)

**POST /api/auth/register** — register user  
**POST /api/auth/login** — login and receive JWT  
**POST /api/complaints** — submit new complaint  
**GET /api/complaints** — retrieve all complaints  
**GET /api/complaints/:id** — retrieve specific complaint  
**DELETE /api/complaints/:id** — remove complaint (admin only)

---

## 9. Setup Instructions

### Backend

cd backend
npm install

bash
Copy code

Create `.env`:

PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_secret
CLOUDINARY_CLOUD_NAME=value
CLOUDINARY_API_KEY=value
CLOUDINARY_API_SECRET=value
REDIS_URL=value



Start backend:

npm run server

### Frontend

cd frontend-app
npm install
npm run dev
---


## 11. Screenshots

> Add screenshots to a folder such as `/assets` or  
> `./frontend-app/src/assets/` and update paths below as needed.

### Login Page
<p align="center">
  <img src="./frontend-app/src/assets/login.jpeg?raw=true" width="450" />
</p>

### Admin Dashboard with Stats
<p align="center">
  <img src="./frontend-app/src/assets/admin.jpeg?raw=true" width="700" />
</p>

### Complaint Form 
<p align="center">
  <img src="./frontend-app/src/assets/form.jpeg?raw=true" width="700" />
</p>

### Chat-Bot
<p align="center">
  <img src="./frontend-app/src/assets/chatbot.png?raw=true" width="700" />
</p>



---

## 12. Error Handling & Reliability

- Request validation for body and file uploads  
- Redis-based rate limiting  
- CORS enabled  

---

## 13. AI / ML Integration

-ChatBot for Admin
-AI auto priority prediction



---

## 14. Team Members


| Name | GitHub |
|------|------|
| Shreya shashwat|  https://github.com/Shreyashashwat |
| Jhalak Yadav |  https://github.com/Jhalak3211 |
| Ishita Singh|  https://github.com/ishu810 |
| Kanak Mohan Jee|  https://github.com/kanakmohanj|

---

## 15. GitHub Checklist

- `.env` added to `.gitignore`  
- Screenshots included  
- Deployment links updated  
- Proper commit messages  
- Folder structure cleaned  

---

## 17. Final Note

This README presents a complete overview of POWER-GRIFO, demonstrating implemented functionalities, tech stack decisions, and reliability concerns while providing references for installation and demonstration.
