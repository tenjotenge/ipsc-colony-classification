# Single-host deployment guide

This guide targets one dedicated Linux host. The Python API and Next.js server bind to `127.0.0.1`; a lab-managed gateway must supply TLS and verified user access for remote browsers. A service token protects the Python API from other local processes but does not identify technicians. Do not expose ports 8765 or 3000 directly to a network.

## Prepare the host

Install the repository under `/opt/colony-atlas` and create a dedicated `colony-atlas` system account. The account needs read access to the checkout and `model.pth`, and write access to `/var/lib/colony-atlas`, `/var/backups/colony-atlas`, and the built `frontend/.next` directory. Keep the source and model inaccessible to unrelated local users. Install Python dependencies in `/opt/colony-atlas/.venv`, run `npm ci` in `frontend/`, and run `npm run build` there. Follow the pinned setup commands in the [README](../README.md).

Copy the `.service` and `.timer` files from [`deploy/systemd`](../deploy/systemd/) into `/etc/systemd/system/`. Copy the three `.env.example` files to `/etc/colony-atlas/` without the `.example` suffix. Set `ATLAS_API_TOKEN` to the same long random value in `api.env` and `web.env`; store these files with mode 0600 and ownership appropriate for systemd and the service account. The paths in the supplied units assume the locations above. If you change a location, update both its environment file and the unit's `ReadWritePaths` or `ExecStart` entry.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now colony-atlas-api.service colony-atlas-web.service colony-atlas-backup.timer
sudo systemctl start colony-atlas-backup.service
```

The last command creates the first verified backup. Check `systemctl status colony-atlas-api colony-atlas-web colony-atlas-backup`, `journalctl -u colony-atlas-api -u colony-atlas-web`, and the newest archive in `/var/backups/colony-atlas`. The Python API should answer `/health`, `/ready`, and authenticated `/api/status` on loopback. The web UI should answer `/inbox` on loopback. Review the [operations guide](operations.md) for restore practice and capacity limits.

## Remote access boundary

Configure the lab's reverse proxy or access gateway to authenticate each technician, enforce TLS, and forward only to `127.0.0.1:3000`. Keep direct access to 3000 and 8765 blocked by host firewall and network policy. The application currently records a technician-entered name for review decisions; it does not bind that name to the gateway identity. Until identity integration is implemented and tested with the lab's provider, treat review attribution as unverified and keep this deployment in a supervised pilot.

## Update and recover

Before updating, take and verify a backup. Stop the web and API services, update the checkout and dependencies, rebuild the frontend, then start the API and web services and check `/ready` and `/inbox`. If a release must be rolled back, restore a verified archive into a **new** data directory and point `ATLAS_DATA_DIR` at it. Keep the associated model file and its checksum with the release; database snapshots do not include `model.pth`. Never restore over an existing data directory. Test the full restore procedure on another host before depending on it.
