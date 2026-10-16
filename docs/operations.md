# Local platform operations

The field inbox is designed for a single Linux host. Its two processes are the Python service (SQLite, image files, one analysis worker) and the Next.js server (browser UI and API proxy). Both bind to loopback by default. A lab deployment needs a local operator who can manage the host, protect the data directory, and install a trained model.

## Start and check

Install the Python and Node dependencies as described in the [README](../README.md), then start these in separate terminals:

```bash
./linux-v1/run.sh service
./linux-v1/run.sh frontend
```

`GET http://127.0.0.1:8765/health` confirms the HTTP process is reachable. `GET /ready` also checks SQLite and the analysis workers. `GET /api/status` reports latest-job counts per field and worker availability; the inbox shows queued, running, and failed fields. The main UI is at `http://127.0.0.1:3000/inbox`. The Python process must stay running for uploads, jobs, reviews, and exports.

The default data directory is `platform_data/`. Override it with `./linux-v1/run.sh service --data-dir /absolute/path`. Set `ATLAS_API_URL` for the Next.js process if the service uses a different loopback address or port. `ATLAS_API_TOKEN` can be set in **both** processes to authenticate Next.js to the Python API; the service requires a token if it is bound beyond localhost. This token is service authentication, not technician identity. Keep both processes on loopback and place any remotely accessed deployment behind a lab-managed TLS and user authentication gateway. The application currently trusts the reviewer name entered on the screen; it does not verify that identity.

## Jobs and model provenance

One job per field can be queued or running at a time. Workers claim distinct queued jobs in order, and interrupted jobs are requeued when the service restarts. Each successful analysis records the SHA-256 of `model.pth`; a job fails if that file changes during processing. A missing model produces a visible failed state. Each worker runs one image at a time, with a one-hour timeout. Start with one worker (the default). `./linux-v1/run.sh service --workers 2` enables local parallel analysis, up to four workers; increase this only after measuring memory and model throughput on the deployment host. This design supports a single-site pilot; it does not coordinate multiple worker hosts or provide a throughput guarantee.

When a field is rerun, its previous analysis remains stored for historical context but is hidden from the current review controls until the new job succeeds. The field export includes `latest_job` and `analysis_current` so downstream readers can distinguish prior output from the latest run.

Imported images are limited to 100 MB and 100 megapixels. Bytes are streamed to disk, checked as PNG, JPEG, or TIFF, and stored by SHA-256. The current analysis still reads a whole image and uses fixed-size tiles; memory and processing time need to be measured with each lab's actual image sizes before setting throughput expectations.

## Back up and restore

Backups can run while the service is active. The command takes a consistent SQLite snapshot, then archives its referenced source images and completed job outputs with SHA-256 checksums. In-progress output is excluded; interrupted jobs are requeued on restore. The command verifies the finished archive and refuses to overwrite one.

```bash
./linux-v1/run.sh backup create --data-dir platform_data --output /secure/backups/atlas-2026-10-16.tar.gz
./linux-v1/run.sh backup verify /secure/backups/atlas-2026-10-16.tar.gz
```

For a timer or cron job, use `backup scheduled --data-dir platform_data --backup-dir /secure/backups`. It creates a verified archive with a UTC timestamp and unique suffix. To use the supplied systemd units, change the `ExecStart` path in `deploy/systemd/colony-atlas-backup.service` to the absolute checkout path, copy both units to `/etc/systemd/system/`, and create `/etc/colony-atlas/backup.env` containing `ATLAS_DATA_DIR=/absolute/data/path` and `ATLAS_BACKUP_DIR=/secure/backups`. Give that file and backup directory permissions appropriate for the service account. Then run `systemctl daemon-reload`, `systemctl enable --now colony-atlas-backup.timer`, and `systemctl start colony-atlas-backup.service` to confirm a first backup. The timer runs daily and catches missed runs after a restart. Monitor timer failures and free space; archives are never deleted automatically. Keep at least one copy off the host and test a restore periodically.

Restore only into a **new, nonexistent** directory; the archive is verified before files are written and the restored directory is moved into place after extraction:

```bash
./linux-v1/run.sh backup restore /secure/backups/atlas-2026-10-16.tar.gz --data-dir /path/to/new-platform-data
```

The archive contains source images, reports, decisions, and job output. It does **not** contain the trained `model.pth`, the Python environment, or the frontend installation. Back those up separately. Store archives in a protected location; they contain full microscopy images and reviewer notes. Practice a restore on a separate machine before relying on backups.

## Current deployment boundary

The service has an explicit SQLite schema version, durable job and decision records, an optional service token, readiness checks, bounded imports, and online, integrity-checked backups with an optional timer. It does not yet have verified user accounts, role-based permissions, TLS termination, multi-host workers, image pyramids for very large fields, or lab information system integration. Those need to be built and tested with a partner site's infrastructure before shared production use.
