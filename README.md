# SIEM Project

This repository contains the backend and frontend codebase for the SIEM project. 

## Project Structure

- `siem_backend/`: Python (Django) backend API architecture
- `siem_frontend/`: React + Vite frontend application

## Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

---

## 1. Backend Setup

The backend is built with Django and Django REST Framework.

Open a terminal and navigate to the backend directory:

```bash
cd siem_backend
```

### Create and Activate Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies

Ensure your virtual environment is activated, then run:

```bash
pip install -r requirements.txt
```

### Setup Database

Run migrations to initialize the SQLite database:

```bash
python manage.py migrate
```

### Run the Development Server

Start the Django development server:

```bash
python manage.py runserver
```

The backend API will be running at `http://localhost:8000/`.

---

## 2. Frontend Setup

The frontend is built with React, Vite, Framer Motion, and TailwindCSS equivalent tools.

Open a **new** terminal and navigate to the frontend directory:

```bash
cd siem_frontend
```

### Install Dependencies

Install the required Node packages:

```bash
npm install
```

### Run the Development Server

Start the Vite development server:

```bash
npm run dev
```

The frontend application will be running at `http://localhost:5173/` (or the port specified in your terminal output).

---

## Additional Information

For more specific and component-level instructions, refer to the individual `README.md` files located in the `siem_backend/` and `siem_frontend/` directories.
