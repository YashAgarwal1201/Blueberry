# FastAPI CRUD Application

A basic CRUD (Create, Read, Update, Delete) API built with FastAPI and Python.

## Features

- Create, Read, Update, Delete users
- Data validation with Pydantic models
- Simple in-memory data storage
- Auto-generated API docs with Swagger UI
- Includes a basic frontend interface (optional)

## Requirements

- Python 3.8+
- FastAPI
- Uvicorn
- Jinja2 (for templates)
- aiofiles (for static files)

## Installation

1. Clone the repo:

git clone https://github.com/YashAgarwal1201/Blueberry.git
cd fastapi

text

2. Create a virtual environment and activate it:

python3 -m venv venv
source venv/bin/activate

text

3. Install dependencies:

pip install -r requirements.txt

text

4. Run the app:

uvicorn main:app --reload --host 0.0.0.0 --port 8000

text

## Usage

- API docs at: [http://localhost:8000/docs](http://localhost:8000/docs)
- Frontend UI at: [http://localhost:8000](http://localhost:8000)

## Project Structure

- `main.py` — FastAPI app and route handlers
- `models.py` — Pydantic schemas for request and response validation
- `database.py` — Functions to manage data (CRUD operations)
- `templates/` — HTML templates for the frontend UI
- `static/` — CSS and JavaScript files
- `requirements.txt` — Python dependencies
- `.gitignore` — Files/directories to ignore in git

## API Endpoints

| Method | Path          | Description       |
| ------ | ------------- | ----------------- |
| GET    | `/users`      | Get all users     |
| GET    | `/users/{id}` | Get user by ID    |
| POST   | `/users`      | Create new user   |
| PUT    | `/users/{id}` | Update user by ID |
| DELETE | `/users/{id}` | Delete user by ID |

## License

MIT License

---

_Created by Your Name_
