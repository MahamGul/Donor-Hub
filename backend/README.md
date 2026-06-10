# Donor Hub - Backend

Requirements:

- Python 3.8+
- Install dependencies:

```bash
pip install -r requirements.txt
```

Environment:

- Put your MongoDB connection string into `backend/.env` as `MONGO_URI` (example in `.env.example`).
- Optionally set `MONGO_DB` for the database name (default: `donorhub`).

Run the development server:

```bash
# on Windows (PowerShell)
$env:MONGO_URI = "your-mongo-uri"
uvicorn app.main:app --reload --port 8000 --app-dir backend/

# on macOS / Linux
export MONGO_URI="your-mongo-uri"
uvicorn app.main:app --reload --port 8000 --app-dir backend/
```

Testing the DB connection:

- Start the server and call `GET /donors` — it should return an array (empty if no docs).

Endpoints:

- `GET /` - basic message
- `GET /health` - health check
- `GET /donors` - list donors from MongoDB
- `POST /donors` - create donor (stores in MongoDB)
- `POST /login` - authenticate a user by email and password
