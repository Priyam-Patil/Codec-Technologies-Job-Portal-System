
# 🚀 InsiderJobs – Full-Stack Job Portal

### 💼 A Modern Job Recruitment Platform Built with the MERN Stack

**Developed as part of the CodeC Technologies project**

🌐 **Live Website:** https://insiderjobs-codec-technologies.vercel.app/

⚡ **Backend API:** https://codec-technologies-job-portal-system.onrender.com/health

💻 **GitHub Repository:** https://github.com/Priyam-Patil/Codec-Technologies-Job-Portal-System

---

## 📌 Project Overview

**InsiderJobs** is a modern, responsive, full-stack job portal designed to connect job seekers with recruiters through a centralized recruitment platform.

The application provides an interactive environment where candidates can discover career opportunities, explore job details, and apply for suitable positions, while recruiters can publish job openings and manage recruitment activities.

Built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)**, the project demonstrates full-stack application development, RESTful API integration, authentication, database management, and cloud deployment.

The platform is deployed using **Vercel**, **Render**, and **MongoDB Atlas**.

### 🎯 Project Objectives

- Build a modern and user-friendly job recruitment platform.
- Simplify the job searching and application process.
- Provide recruiters with tools to manage job openings.
- Implement secure authentication and protected workflows.
- Develop scalable RESTful APIs.
- Integrate a cloud-hosted MongoDB database.
- Deploy a complete full-stack application.
- Provide a responsive experience across devices.

---

## ✨ Key Features

### 👨‍💻 Job Seeker Features

- 🔍 **Job Search:** Discover opportunities through job listings.
- 📂 **Job Categories:** Browse jobs based on professional categories.
- 📍 **Location-Based Discovery:** Explore opportunities in different cities.
- 📄 **Job Details:** View descriptions, requirements, salaries, and experience levels.
- 📝 **Job Applications:** Apply for available positions.
- 🔐 **Authentication:** Access account-related features securely.
- 📱 **Responsive Interface:** Browse the platform on desktop, tablet, and mobile devices.

### 🏢 Recruiter Features

- 📊 **Recruiter Dashboard:** Access recruitment management features.
- ➕ **Post Jobs:** Create and publish new job opportunities.
- ✏️ **Manage Listings:** Maintain and update job information.
- 👥 **Applicant Management:** Review applications submitted by candidates.
- 💼 **Job Information:** Configure titles, descriptions, categories, locations, experience levels, and salaries.
- 🔒 **Protected Access:** Restrict recruiter operations to authorized users.

### ⚙️ Platform Features

- 🌐 Full-stack MERN architecture.
- 🔗 RESTful API integration.
- 🗄️ MongoDB Atlas cloud database.
- 🔑 Clerk authentication integration.
- ☁️ Cloudinary media integration.
- 🚀 Vercel frontend deployment.
- 🖥️ Render backend deployment.
- 🛡️ Environment-based configuration.
- 📡 API health monitoring.
- 🎨 Responsive and interactive user interface.

---

## 🛠️ Technologies Used

### 🎨 Frontend Technologies

| Technology | Purpose |
|------------|---------|
| React.js | Building interactive user interfaces |
| Vite | Fast development and production builds |
| JavaScript (ES6+) | Frontend application logic |
| HTML5 | Webpage structure |
| CSS3 | Styling and responsive layouts |

### ⚙️ Backend Technologies

| Technology | Purpose |
|------------|---------|
| Node.js | Server-side JavaScript runtime |
| Express.js | RESTful API development |
| Mongoose | MongoDB data modeling and queries |
| JWT | Token-based authentication where applicable |

### 🗄️ Database Technologies

| Technology | Purpose |
|------------|---------|
| MongoDB | NoSQL database |
| MongoDB Atlas | Cloud database hosting |

### 🔐 Authentication & Cloud Services

| Technology | Purpose |
|------------|---------|
| Clerk | User authentication and account management |
| Cloudinary | Cloud-based media storage |

### ☁️ Deployment Platforms

| Platform | Purpose |
|----------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| MongoDB Atlas | Database hosting |
| GitHub | Source code management |

### 🧰 Development Tools

- Visual Studio Code
- Git
- GitHub
- npm
- Browser Developer Tools

---

## 🏗️ System Architecture

InsiderJobs follows a client-server architecture.

**Application Workflow:**

1. Users access the React frontend hosted on Vercel.
2. The frontend sends HTTPS requests to the Express.js backend.
3. The backend validates requests and performs business operations.
4. Mongoose communicates with MongoDB Atlas.
5. The backend returns API responses to the frontend.
6. React updates the interface with the received data.

### 🔄 Architecture Flow

```text
          👨‍💻 Job Seekers / 🏢 Recruiters
                         |
                         v
               React.js + Vite
                Frontend UI
                  (Vercel)
                         |
                         v
                 HTTPS / REST API
                         |
                         v
              Node.js + Express.js
                 Backend Server
                    (Render)
                         |
                         v
                     Mongoose
                         |
                         v
                  MongoDB Atlas
                  Cloud Database
```

**Additional Integrations:**

- Clerk – Authentication and identity management.
- Cloudinary – Media management and storage.

---

## 📁 Project Folder Structure

```text
Codec-Technologies-Job-Portal-System/
|
|-- client/
|   |-- public/
|   |-- src/
|   |-- package.json
|   |-- vite.config.js
|
|-- server/
|   |-- server.js
|   |-- package.json
|   |-- ...
|
|-- docs/
|
|-- README.md
|-- .gitignore
```

**Folder Description:**

- `client/` – React frontend application.
- `server/` – Express.js backend application.
- `docs/` – Project documentation and testing evidence.
- `README.md` – Project documentation.
- `.gitignore` – Files excluded from version control.

---

## ⚙️ Installation and Setup

Follow these steps to run InsiderJobs locally.

### 📋 Prerequisites

Make sure the following are available:

- Node.js
- npm
- Git
- MongoDB Atlas account
- Clerk account
- Cloudinary account (for media features)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Priyam-Patil/Codec-Technologies-Job-Portal-System.git

cd Codec-Technologies-Job-Portal-System
```

### 2️⃣ Install Backend Dependencies

```bash
cd server
npm install
```

### 3️⃣ Configure Backend Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key

ALLOWED_ORIGINS=http://localhost:5173
```

> 🔒 Never upload your `.env` file or private credentials to GitHub.

### 4️⃣ Start the Backend Server

```bash
node server.js
```

The backend starts after successful initialization and database connection.

### 5️⃣ Install Frontend Dependencies

Open a second terminal from the project root.

```bash
cd client
npm install
```

### 6️⃣ Configure Frontend Environment Variables

Create a `.env` file inside the `client` directory.

```env
VITE_BACKEND_URL=http://localhost:5000

VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

> ⚠️ Vite exposes `VITE_` environment variables to the browser. Never store private API keys or database credentials in them.

### 7️⃣ Start the Frontend

```bash
npm run dev
```

Open the local development URL shown in the terminal.

Typically:

http://localhost:5173

---

## 🌍 Live Deployment

The application uses separate hosting services for the frontend, backend, and database.

| Component | Hosting Platform | Status |
|-----------|------------------|--------|
| Frontend | Vercel | Deployed |
| Backend | Render | Deployed |
| Database | MongoDB Atlas | Connected |
| Authentication | Clerk | Integrated |
| Media Storage | Cloudinary | Integrated |

### 🌐 Frontend

**Platform:** Vercel

**Live URL:**

https://insiderjobs-codec-technologies.vercel.app/

### ⚡ Backend

**Platform:** Render

**API Health Endpoint:**

https://codec-technologies-job-portal-system.onrender.com/health

### 🗄️ Database

**Platform:** MongoDB Atlas

**Database Name:** `insiderjobs_codec`

**Cluster:** `InsiderJobsCluster`

> The Render free instance may experience a cold-start delay after periods of inactivity.

---

## 🩺 API Health Check

The backend provides a health-check endpoint.

**Method:** `GET`

**Endpoint:** `/health`

**Live URL:**

https://codec-technologies-job-portal-system.onrender.com/health

### Example Successful Response

```json
{
  "success": true,
  "service": "insiderjobs-api",
  "database": "connected"
}
```

This confirms that the backend is operational and the database connection is available.

---

## 👥 User Roles

### 👨‍💻 Job Seeker

Job seekers can explore opportunities, view job details, and interact with available application features.

**Typical Workflow:**

1. Visit the InsiderJobs website.
2. Sign in or create an account.
3. Browse available jobs.
4. View job descriptions and requirements.
5. Submit an application for a suitable position.
6. Access available account and application information.

### 🏢 Recruiter

Recruiters can publish opportunities and manage recruitment activities.

**Typical Workflow:**

1. Sign in to the platform.
2. Open the recruiter dashboard.
3. Create a job posting.
4. Enter job title, description, location, category, salary, and experience level.
5. Publish the job.
6. Review applications and manage job listings.

---

## 🧪 Testing and Quality Assurance

Testing focuses on validating frontend functionality, backend integration, database connectivity, authentication, and recruitment workflows.

### 🔍 Functional Testing Areas

| Test Area | Verification |
|-----------|--------------|
| Homepage | Application loads correctly |
| Navigation | Pages and routes work |
| Authentication | Sign-in and sign-out workflows |
| Job Listings | Jobs display correctly |
| Job Search | Search and filters function |
| Job Details | Job information displays |
| Recruiter Dashboard | Authorized recruiter access |
| Job Creation | Job records are saved |
| Job Management | Listings can be managed |
| Job Applications | Candidate application workflow |
| API Integration | Frontend communicates with backend |
| Database | Records persist in MongoDB |
| Responsive Design | Layout adapts to devices |
| Deployment | Production services remain accessible |

### ✅ Confirmed Deployment Checks

- Frontend deployed on Vercel.
- Backend deployed successfully on Render.
- MongoDB Atlas database connected.
- Backend health endpoint returned a successful response.
- Production backend URL configured for the frontend.

> Individual features and third-party integrations should be verified separately before claiming full production readiness.

---

## 🔒 Security Practices

Security is an important consideration in InsiderJobs.

- 🔐 Store private credentials in environment variables.
- 🛡️ Use authentication and authorization for protected operations.
- 🌐 Use HTTPS for deployed services.
- 🔑 Keep database passwords and API secrets private.
- 🚫 Exclude `.env` files from version control.
- 🔗 Configure allowed frontend origins.
- 🗄️ Restrict database network access wherever possible.
- 🔄 Rotate exposed credentials.
- 📦 Keep dependencies updated.
- 👤 Apply appropriate permissions to database users.

---

## 💡 Challenges and Solutions

### 1. MongoDB Atlas Connection Issues

**Challenge:** Backend deployment initially failed because the database connection could not be established.

**Solution:** Created a new MongoDB Atlas cluster, configured the connection string, updated backend environment variables, and corrected database network access.

### 2. Backend Deployment

**Challenge:** The Render service initially failed during application startup.

**Solution:** Reviewed deployment logs, corrected database configuration, and successfully redeployed the backend.

### 3. Frontend and Backend Integration

**Challenge:** The deployed frontend initially referenced a local development API URL.

**Solution:** Updated `VITE_BACKEND_URL` with the production Render HTTPS endpoint and configured the frontend deployment.

### 4. Environment Variable Security

**Challenge:** Public frontend configuration and private backend credentials required different handling.

**Solution:** Kept public Vite configuration separate from private backend secrets.

---

## 📚 Learning Outcomes

Through this project, I gained practical experience in:

- Full-stack MERN application development.
- React component-based architecture.
- RESTful API development with Express.js.
- MongoDB database integration.
- Authentication and authorization.
- Recruiter and candidate workflows.
- Cloud deployment using Vercel and Render.
- MongoDB Atlas configuration and troubleshooting.
- Environment variable management.
- Debugging production deployment errors.
- Testing and validating full-stack workflows.
- Git and GitHub version control.

---

## 🚀 Future Enhancements

Potential future improvements include:

- 🤖 AI-powered job recommendations.
- 📄 Automated resume parsing.
- 🎯 Skill-based job matching.
- 📊 Advanced recruiter analytics.
- 📅 Interview scheduling.
- 🔔 Real-time notifications.
- 📈 Application tracking improvements.
- 🌍 Advanced location-based job discovery.
- 🧪 Automated end-to-end testing.
- ⚡ Performance and scalability optimization.

---

## 👨‍💻 Developed By

**Priyam Patil**

**Project:** InsiderJobs – Full-Stack Job Portal

**Organization:** CodeC Technologies

**Technology Stack:** MERN Stack

**GitHub Profile:** https://github.com/Priyam-Patil

---
