# Referra – Referral Web App to Ease the Hiring Process

---

## Table of Contents 

- [Features](#features)
- [Technologies](#technologies)
- [Installation full setup](#installation)

---

## Features

- Role based authentication (Employee/HR) with Supabase
- Employee referral submission
- Referral status tracking
- HR dashboard
- Email notifications (Resend)
- Secure backend with Prisma ORM
- PostgreSQL database

---

## Technologies

### Frontend
- Vite

### Backend
- Express.js
- Prisma

### Services
- Supabase (authentication & storage)
- Resend (emails)

### Database
- PostgreSQL (Neon)

### Deployment
- Vercel (separate deployments for frontend and backend)

--- 

## Installation

#### 1. Clone the Repository
   
```bash
git clone https://github.com/alahmad-loay2/referra.git
```

```bash
cd referra
```


#### 2. Frontend setup
  
```bash
cd referraFrontend/referra
```

```bash
npm install
```


##### Create .env file 

```env
VITE_API_BASE_URL=http://localhost:5500/api
```


##### Run the project 

```bash
npm run dev
```


#### 3. Backend setup

```bash
cd referraBackend
```

```bash
npm install
```


##### Create .env.development.local file

```env
# PORT 
PORT=5500

# ENVIRONMENT
NODE_ENV="development"

# FRONTEND 
FRONTEND_URL="http://localhost:5173"

#supabase
SUPABASE_URL="your supabase url"
SUPABASE_ANON_KEY="your supabase anon key"

#resend 
RESEND_API_KEY="Your resend api key for your domain"
```


##### Create .env file

```env
DATABASE_URL='Your PostgreSQL database Url'
```


##### Database setup

```bash
npx prisma migrate dev --name init
```

```bash
npx prisma generate
```


##### Run the project

```bash
npm run dev
```

--- 

[Back To The Top](#referra--referral-web-app-to-ease-the-hiring-process)
