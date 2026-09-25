from __future__ import annotations

import json
import mimetypes
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATA_FILE = ROOT / "data" / "students.json"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))

SEED_STUDENTS = [
    {"id": "1", "name": "Amina Mwakalinga", "code": "IS-2026-001", "className": "Form 4", "status": "Active"},
    {"id": "2", "name": "Daniel Mhando", "code": "IS-2026-002", "className": "Form 3", "status": "Active"},
    {"id": "3", "name": "Neema Joseph", "code": "IS-2026-003", "className": "Form 2", "status": "Inactive"},
]


def ensure_data_file() -> None:
    DATA_FILE.parent.mkdir(exist_ok=True)
    if not DATA_FILE.exists():
        DATA_FILE.write_text(json.dumps(SEED_STUDENTS, indent=2) + "\n", encoding="utf-8")


def read_students() -> list[dict]:
    ensure_data_file()
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def write_students(students: list[dict]) -> None:
    DATA_FILE.write_text(json.dumps(students, indent=2) + "\n", encoding="utf-8")


class StudentManagementHandler(BaseHTTPRequestHandler):
    server_version = "StudentManagement/1.0"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_json({"status": "ok", "service": "student-management"})
        elif parsed.path == "/api/students":
            self.send_json(read_students())
        elif parsed.path.startswith("/api/"):
            self.send_error(HTTPStatus.NOT_FOUND, "API route not found")
        else:
            self.serve_static(parsed.path)

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/students":
            self.send_error(HTTPStatus.NOT_FOUND, "API route not found")
            return
        student = self.read_json()
        required = {"name", "code", "className", "status"}
        if not required.issubset(student):
            self.send_json({"error": "name, code, className, and status are required"}, HTTPStatus.BAD_REQUEST)
            return
        students = read_students()
        student["id"] = str(max([int(item["id"]) for item in students if item["id"].isdigit()] or [0]) + 1)
        students.append(student)
        write_students(students)
        self.send_json(student, HTTPStatus.CREATED)

    def do_PUT(self) -> None:
        student_id = self.resource_id()
        if student_id is None:
            return
        updates = self.read_json()
        students = read_students()
        for index, student in enumerate(students):
            if student["id"] == student_id:
                students[index] = {**student, **updates, "id": student_id}
                write_students(students)
                self.send_json(students[index])
                return
        self.send_error(HTTPStatus.NOT_FOUND, "Student not found")

    def do_DELETE(self) -> None:
        student_id = self.resource_id()
        if student_id is None:
            return
        students = read_students()
        remaining = [student for student in students if student["id"] != student_id]
        if len(remaining) == len(students):
            self.send_error(HTTPStatus.NOT_FOUND, "Student not found")
            return
        write_students(remaining)
        self.send_json({"deleted": student_id})

    def resource_id(self) -> str | None:
        parts = urlparse(self.path).path.rstrip("/").split("/")
        if len(parts) != 4 or parts[:3] != ["", "api", "students"]:
            self.send_error(HTTPStatus.NOT_FOUND, "Student route not found")
            return None
        return unquote(parts[3])

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def send_json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, requested_path: str) -> None:
        relative_path = unquote(requested_path.lstrip("/")) or "index.html"
        file_path = (ROOT / relative_path).resolve()
        if ROOT not in file_path.parents and file_path != ROOT:
            self.send_error(HTTPStatus.FORBIDDEN, "Forbidden")
            return
        if not file_path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")
            return
        body = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", mimetypes.guess_type(file_path.name)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        print(f"{self.address_string()} - {format % args}")


if __name__ == "__main__":
    ensure_data_file()
    server = ThreadingHTTPServer((HOST, PORT), StudentManagementHandler)
    print(f"Student Management server running at http://{HOST}:{PORT}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()
