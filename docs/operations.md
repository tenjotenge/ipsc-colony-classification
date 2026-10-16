# Local platform operations

The field inbox is designed for a single Linux host. Its two processes are the Python service (SQLite, image files, one analysis worker) and the Next.js server (browser UI and API proxy). Both bind to loopback by default. A lab deployment needs a local operator who can manage the host, protect the data directory, and install a trained model.

## Start and check

Install the Python and Node dependencies as described in the [README](../README.md), then start these in separate terminals:

```bash
./linux-v1/run.sh service
./linux-v1/run.sh frontend
```

`GET http://127.0.0.1:8765/health` confirms the HTTP process is reachable. `GET /ready` also checks SQLite and the analysis worker. The main UI is at `http://127.0.0.1:3000/inbox`. The Python process must stay running for uploads, jobs, reviews, and exports.

The default data directory is `platform_data/`. Override it with `./linux-v1/run.sh service --data-dir /absolute/path`. Set `ATLAS_API_URL` for the Next.js process if the service uses a different loopback address or port. `ATLAS_API_TOKEN` can be set in **both** processes to authenticate Next.js to the Python API; the service requires a token if it is bound beyond localhost. This token is service authentication, not technician identity. Keep both processes on loopback and place any remotely accessed deployment behind a lab-managed TLS and user authentication gateway. The application currently trusts the reviewer name entered on the screen; it does not verify that identity.

## Jobs and model provenance

One job per field can be queued or running at a time. A worker processes queued jobs in order, and interrupted jobs are requeued when the service restarts. Each successful analysis records the SHA-256 of `model.pth`; a job fails if that file changes during processing. A missing model produces a visible failed state. The worker runs one image at a time, with a one-hour timeout. This design supports a single-site pilot; it does not coordinate multiple worker hosts or provide a throughput guarantee.

Imported images are limited to 100 MB and 100 megapixels. Bytes are streamed to disk, checked as PNG, JPEG, or TIFF, and stored by SHA-256. The current analysis still reads a whole image and uses fixed-size tiles; memory and processing time need to be measured with each lab's actual image sizes before setting throughput expectations.

## Back up and restore

Stop the service before backing up. The backup command obtains an exclusive data-directory lock, takes a consistent SQLite snapshot, and archives source images and analysis outputs with SHA-256 checksums. It refuses to overwrite an existing archive.

```bash
./linux-v1/run.sh backup create --data-dir platform_data --output /secure/backups/atlas-2026-10-16.tar.gz
./linux-v1/run.sh backup verify /secure/backups/atlas-2026-10-16.tar.gz
```

Restore only into a **new, nonexistent** directory; the archive is verified before files are written and the restored directory is moved into place after extraction:

```bash
./linux-v1/run.sh backup restore /secure/backups/atlas-2026-10-16.tar.gz --data-dir /path/to/new-platform-data
```

The archive contains source images, reports, decisions, and job output. It does **not** contain the trained `model.pth`, the Python environment, or the frontend installation. Back those up separately. Store archives in a protected location; they contain full microscopy images and reviewer notes. Practice a restore on a separate machine before relying on backups.

## Current deployment boundary

The service has an explicit SQLite schema version, durable job and decision records, an optional service token, readiness checks, bounded imports, and an offline backup path. It does not yet have verified user accounts, role-based permissions, automatic backup scheduling, TLS termination, multi-host workers, image pyramids for very large fields, or lab information system integration. Those need to be built and tested with a partner site's infrastructure before shared production use.
