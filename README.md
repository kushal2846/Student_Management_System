# 🎓 Student Management System

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![React](https://img.shields.io/badge/React-18.x-blue)
![Django](https://img.shields.io/badge/Django-4.x-darkgreen)
![MySQL](https://img.shields.io/badge/MySQL-8.x-blue)

A comprehensive, scalable, and highly secure **Full-Stack Student Management System** designed to streamline academic administrative workflows, manage student data, and provide real-time insights into institutional performance.

---

## 🌟 Key Features

- **🔐 Role-Based Access Control (RBAC):** Secure JWT authentication with strict permission isolation for Students, Teachers, and Administrators.
- **📊 Advanced Analytics Dashboard:** Dynamic, real-time administrative dashboards for monitoring attendance, grades, and fee collection.
- **📅 Real-Time Attendance & Scheduling:** Automated attendance tracking and robust curriculum/timetable management mapped to engineering standards.
- **📝 Comprehensive Academic Modules:** End-to-end management of courses, homework, assignments, and digital library records.
- **📈 Dynamic Grade Reporting:** Automated calculation of GPA and seamless, granular student performance tracking.
- **📑 Multi-Sheet Data Exports:** Robust pipeline to automate the generation of global database summaries and student-specific performance reports via multi-sheet Excel exports.
- **📁 Document Handling:** Secure document upload and centralized management system for student records.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **State Management:** React Hooks & Context API
- **Icons & UI:** Heroicons, custom SVG assets

### Backend
- **Framework:** Django & Django REST Framework (DRF)
- **Database:** MySQL
- **Authentication:** JSON Web Tokens (JWT) via SimpleJWT
- **Data Processing:** Python Pandas & OpenPyXL (for robust Excel exports)

## 📂 Project Structure

```text
Student_Management_System/
├── backend/                  # Django REST API backend
│   ├── core/                 # Main Django project settings & routing
│   ├── sms/                  # Core student management app (Models, Views, Serializers)
│   ├── media/                # Uploaded student documents & files
│   ├── manage.py             # Django entry point
│   └── seed_*.py             # Database population scripts for testing robust data
└── frontend/                 # React.js frontend application
    ├── public/               # Static assets
    ├── src/                  # React source code (Components, Pages, App configuration)
    ├── package.json          # Node.js dependencies
    ├── tailwind.config.js    # Tailwind CSS configuration
    └── vite.config.js        # Vite bundler configuration
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v16+ recommended)
- **Python** (v3.10+ recommended)
- **MySQL Server** running locally or remotely

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: Ensure required packages like `django`, `djangorestframework`, `djangorestframework-simplejwt`, `mysqlclient`, `pandas`, `openpyxl`, and `corsheaders` are installed)*

4. **Configure Database:**
   Update the `DATABASES` dictionary in `backend/core/settings.py` with your local MySQL credentials.

5. **Run Migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
6. **Seed Data (Optional but recommended):**
   ```bash
   python seed_robust_data.py
   ```
7. **Start the Development Server:**
   ```bash
   python manage.py runserver
   ```

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install node modules:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Access the Application:**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📄 License
This project is open-source and licensed under the MIT License.
