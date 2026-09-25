# Student Management Backend

A dependency-free Python server for the Student Management frontend.

## Start the server

From this folder, run:

```powershell
python server.py
```

Then open http://127.0.0.1:8000 in a browser. The server uses port `8000` by default. To use another port in PowerShell:

```powershell
$env:PORT=8080; python server.py
```

## API routes

- `GET /api/health` checks that the server is running.
- `GET /api/students` returns all students.
- `POST /api/students` creates a student from JSON.
- `PUT /api/students/{id}` updates a student.
- `DELETE /api/students/{id}` removes a student.

Records are stored in `data/students.json`.
