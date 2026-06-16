#!/usr/bin/env bash
# Bootstraps and starts a local PostgreSQL 16 cluster for the app.
# No Docker required — uses the server binaries installed at /usr/lib/postgresql/16/bin.
# Postgres refuses to run as root, so the cluster runs under the `postgres` system user.
set -euo pipefail

PG_BIN=/usr/lib/postgresql/16/bin
PGDATA=/var/lib/postgresql/clima-pgdata
PORT=5432
DB_NAME=clima
DB_USER=clima
DB_PASS=clima

run_pg() { sudo -u postgres env PATH="$PG_BIN:$PATH" "$@"; }

if [ ! -d "$PGDATA/base" ]; then
  echo "==> Initializing Postgres cluster at $PGDATA"
  sudo mkdir -p "$PGDATA"
  sudo chown postgres:postgres "$PGDATA"
  run_pg initdb -D "$PGDATA" -U postgres --auth=trust >/dev/null
  run_pg bash -c "{ echo \"unix_socket_directories = '/tmp'\"; echo \"listen_addresses = 'localhost'\"; echo \"port = $PORT\"; } >> '$PGDATA/postgresql.conf'"
fi

if ! run_pg pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
  echo "==> Starting Postgres"
  run_pg pg_ctl -D "$PGDATA" -l "$PGDATA/server.log" -w start
else
  echo "==> Postgres already running"
fi

for i in $(seq 1 30); do
  if run_pg pg_isready -h localhost -p "$PORT" -U postgres >/dev/null 2>&1; then break; fi
  sleep 0.5
done

echo "==> Ensuring role and database exist"
run_pg psql -h localhost -p "$PORT" -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 \
  || run_pg psql -h localhost -p "$PORT" -U postgres -c "CREATE ROLE $DB_USER LOGIN SUPERUSER PASSWORD '$DB_PASS';"
run_pg psql -h localhost -p "$PORT" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || run_pg psql -h localhost -p "$PORT" -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "==> Postgres ready: postgresql://$DB_USER:$DB_PASS@localhost:$PORT/$DB_NAME"
