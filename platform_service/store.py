from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class Store:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.db_path = self.root / "atlas.sqlite3"
        self.initialize()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, timeout=30)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA busy_timeout=30000")
        return connection

    def initialize(self) -> None:
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS fields (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    image_path TEXT NOT NULL,
                    sha256 TEXT NOT NULL,
                    width INTEGER NOT NULL,
                    height INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY,
                    field_id TEXT NOT NULL REFERENCES fields(id),
                    status TEXT NOT NULL CHECK(status IN ('queued','running','succeeded','failed')),
                    error TEXT,
                    created_at TEXT NOT NULL,
                    started_at TEXT,
                    finished_at TEXT
                );
                CREATE INDEX IF NOT EXISTS jobs_field_created ON jobs(field_id, created_at DESC);
                CREATE TABLE IF NOT EXISTS analyses (
                    job_id TEXT PRIMARY KEY REFERENCES jobs(id),
                    field_id TEXT NOT NULL REFERENCES fields(id),
                    report_json TEXT NOT NULL,
                    model_sha256 TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS decisions (
                    id TEXT PRIMARY KEY,
                    field_id TEXT NOT NULL REFERENCES fields(id),
                    job_id TEXT NOT NULL REFERENCES analyses(job_id),
                    colony_id TEXT NOT NULL,
                    decision TEXT NOT NULL CHECK(decision IN ('shortlist','flag','reject')),
                    reviewer TEXT NOT NULL,
                    note TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS decisions_field_created ON decisions(field_id, created_at DESC);
            """)
            # A stopped process must not leave jobs permanently in the running state.
            db.execute("UPDATE jobs SET status='queued', started_at=NULL WHERE status='running'")

    def add_field(self, filename: str, image_path: str, digest: str, width: int, height: int) -> dict:
        field = dict(id=uuid4().hex, filename=filename, image_path=image_path,
                     sha256=digest, width=width, height=height, created_at=now())
        with self.connect() as db:
            db.execute("""INSERT INTO fields(id, filename, image_path, sha256, width, height, created_at)
                          VALUES (:id,:filename,:image_path,:sha256,:width,:height,:created_at)""", field)
        return field

    def list_fields(self) -> list[dict]:
        with self.connect() as db:
            return [dict(row) for row in db.execute("""SELECT f.*, (SELECT status FROM jobs j WHERE j.field_id=f.id
                ORDER BY j.created_at DESC, j.rowid DESC LIMIT 1) AS latest_status
                FROM fields f ORDER BY f.created_at DESC, f.rowid DESC""")]

    def get_field(self, field_id: str) -> dict | None:
        with self.connect() as db:
            row = db.execute("SELECT * FROM fields WHERE id=?", (field_id,)).fetchone()
            return dict(row) if row else None

    def add_job(self, field_id: str) -> dict:
        job = dict(id=uuid4().hex, field_id=field_id, status="queued", error=None,
                   created_at=now(), started_at=None, finished_at=None)
        with self.connect() as db:
            if not db.execute("SELECT 1 FROM fields WHERE id=?", (field_id,)).fetchone():
                raise KeyError("field not found")
            active = db.execute("SELECT 1 FROM jobs WHERE field_id=? AND status IN ('queued','running')", (field_id,)).fetchone()
            if active:
                raise ValueError("analysis already queued or running")
            db.execute("""INSERT INTO jobs(id, field_id, status, error, created_at, started_at, finished_at)
                          VALUES (:id,:field_id,:status,:error,:created_at,:started_at,:finished_at)""", job)
        return job

    def list_jobs(self, field_id: str | None = None) -> list[dict]:
        with self.connect() as db:
            if field_id:
                rows = db.execute("SELECT * FROM jobs WHERE field_id=? ORDER BY created_at DESC, rowid DESC", (field_id,))
            else:
                rows = db.execute("SELECT * FROM jobs ORDER BY created_at DESC, rowid DESC")
            return [dict(row) for row in rows]

    def claim_job(self) -> dict | None:
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT * FROM jobs WHERE status='queued' ORDER BY created_at, rowid LIMIT 1").fetchone()
            if not row:
                return None
            db.execute("UPDATE jobs SET status='running', started_at=? WHERE id=?", (now(), row["id"]))
            return dict(row)

    def finish_job(self, job_id: str, report: dict | None, model_sha256: str | None, error: str | None = None) -> None:
        with self.connect() as db:
            if report is not None and model_sha256 is not None:
                field_id = db.execute("SELECT field_id FROM jobs WHERE id=?", (job_id,)).fetchone()[0]
                db.execute("""INSERT INTO analyses(job_id, field_id, report_json, model_sha256, created_at)
                              VALUES (?,?,?,?,?)""", (job_id, field_id, json.dumps(report), model_sha256, now()))
            db.execute("UPDATE jobs SET status=?, error=?, finished_at=? WHERE id=?",
                       ("failed" if error else "succeeded", error, now(), job_id))

    def latest_analysis(self, field_id: str) -> dict | None:
        with self.connect() as db:
            row = db.execute("""SELECT a.* FROM analyses a JOIN jobs j ON j.id=a.job_id
                WHERE a.field_id=? ORDER BY j.created_at DESC, j.rowid DESC LIMIT 1""", (field_id,)).fetchone()
            if not row:
                return None
            result = dict(row)
            result["report"] = json.loads(result.pop("report_json"))
            return result

    def add_decision(self, field_id: str, job_id: str, colony_id: str, decision: str,
                     reviewer: str, note: str) -> dict:
        if decision not in {"shortlist", "flag", "reject"}:
            raise ValueError("invalid decision")
        entry = dict(id=uuid4().hex, field_id=field_id, job_id=job_id, colony_id=colony_id,
                     decision=decision, reviewer=reviewer, note=note, created_at=now())
        with self.connect() as db:
            row = db.execute("SELECT report_json FROM analyses WHERE job_id=? AND field_id=?", (job_id, field_id)).fetchone()
            if not row:
                raise ValueError("analysis not found for field")
            colonies = json.loads(row[0]).get("ranked_colonies", [])
            if colony_id not in {item["colony_id"] for item in colonies}:
                raise ValueError("colony not found in analysis")
            db.execute("""INSERT INTO decisions(id, field_id, job_id, colony_id, decision, reviewer, note, created_at)
                          VALUES (:id,:field_id,:job_id,:colony_id,:decision,:reviewer,:note,:created_at)""", entry)
        return entry

    def list_decisions(self, field_id: str) -> list[dict]:
        with self.connect() as db:
            return [dict(row) for row in db.execute("SELECT * FROM decisions WHERE field_id=? ORDER BY created_at, rowid", (field_id,))]
