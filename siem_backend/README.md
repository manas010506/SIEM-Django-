# SIEM Backend - Django REST API

Security Information and Event Management system backend built with Django.

## Features

- Log ingestion and management
- Alert detection rules
- Real-time security monitoring
- RESTful API endpoints
- JWT authentication
- Works with both SQLite and MySQL

## Quick Start

### 1. Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Choose Database

**Option A: SQLite (Recommended for beginners)**
- No setup required!
- Already configured in `settings.py`

**Option B: MySQL**
- Install MySQL
- Create database (see MYSQL_SETUP_GUIDE.md)
- Uncomment MySQL config in `settings.py`
- Install: `pip install mysqlclient`

### 3. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser

```bash
python manage.py createsuperuser
# Username: admin
# Password: admin123
```

### 5. Generate Sample Data

```bash
python generate_sample_data.py
```

This creates:
- 5 log sources
- 10,000+ sample logs
- 5 detection rules
- Realistic attack scenarios

### 6. Run Server

```bash
python manage.py runserver
```

Server will be available at: http://localhost:8000

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login (get JWT tokens)
- `POST /api/auth/refresh/` - Refresh access token

### Logs
- `GET /api/logs/` - List all logs
- `GET /api/logs/{id}/` - Get log details
- `POST /api/logs/ingest/` - Ingest new log
- `GET /api/logs/sources/` - List log sources

### Alerts
- `GET /api/alerts/` - List all alerts
- `GET /api/alerts/{id}/` - Get alert details
- `POST /api/alerts/{id}/acknowledge/` - Acknowledge alert
- `POST /api/alerts/{id}/resolve/` - Resolve alert

### Alert Rules
- `GET /api/alert-rules/` - List all rules
- `POST /api/alert-rules/` - Create new rule

### Analytics
- `GET /api/analytics/dashboard/` - Dashboard statistics

## Testing the API

### Using curl:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get logs (with token)
curl http://localhost:8000/api/logs/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Python:

```python
import requests

# Login
response = requests.post('http://localhost:8000/api/auth/login/', 
    json={'username': 'admin', 'password': 'admin123'})
token = response.json()['access']

# Get logs
headers = {'Authorization': f'Bearer {token}'}
logs = requests.get('http://localhost:8000/api/logs/', headers=headers)
print(logs.json())
```

## Admin Panel

Access Django admin at: http://localhost:8000/admin
- Username: admin
- Password: admin123

## Project Structure

```
siem_backend/
├── siem_backend/          # Project settings
│   ├── settings.py       # Database & app configuration
│   └── urls.py           # URL routing
├── logs/                  # Log management app
│   ├── models.py         # Log & LogSource models
│   ├── views.py          # API views
│   └── serializers.py    # DRF serializers
├── alerts/                # Alert system app
│   ├── models.py         # Alert & AlertRule models
│   ├── views.py          # API views
│   └── serializers.py    # DRF serializers
├── analytics/             # Analytics app
│   └── views.py          # Dashboard stats
├── users/                 # User management
├── generate_sample_data.py  # Sample data generator
├── manage.py
└── requirements.txt
```

## Switching Between Databases

### SQLite → MySQL

1. Backup data:
```bash
python manage.py dumpdata > backup.json
```

2. Change `settings.py` database config to MySQL

3. Run migrations:
```bash
python manage.py migrate
```

4. Load data:
```bash
python manage.py loaddata backup.json
```

### MySQL → SQLite

Same process, just reverse the database config!

## Troubleshooting

### Issue: "No module named 'logs'"
**Solution:** Make sure you created the apps:
```bash
python manage.py startapp logs
python manage.py startapp alerts
python manage.py startapp analytics
```

### Issue: "mysqlclient" not installing
**Solution:** Use SQLite instead, or install MySQL connector:
```bash
pip install PyMySQL
# Add to settings.py: import pymysql; pymysql.install_as_MySQLdb()
```

### Issue: CORS errors from frontend
**Solution:** Make sure `corsheaders` is in INSTALLED_APPS and MIDDLEWARE

## Next Steps

1. Connect frontend (React or HTML/CSS/JS)
2. Test all API endpoints
3. Customize detection rules
4. Add more log sources
5. Deploy to production

## Support

For issues or questions:
1. Check the documentation in the `/docs` folder
2. Review the code comments
3. Ask your team members!

## License

Educational project for SIEM learning

===============================================================================
END OF BACKEND CODE
===============================================================================

SETUP CHECKLIST:
✅ Copy all files to respective locations
✅ Choose database (SQLite or MySQL)
✅ Install dependencies: pip install -r requirements.txt
✅ Run migrations: python manage.py migrate
✅ Create superuser: python manage.py createsuperuser
✅ Generate data: python generate_sample_data.py
✅ Run server: python manage.py runserver
✅ Login: username=admin, password=admin123

The backend is now ready to connect with your frontend!
