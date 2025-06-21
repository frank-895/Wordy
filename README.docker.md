# Docker Setup for Wordy

This project includes a complete Docker setup with PostgreSQL, Django backend,
and Vite frontend with HTTPS support using mkcert.

## Services

- **db**: PostgreSQL 15 database
- **backend**: Django application with PostgreSQL support
- **frontend**: Vite development server with React and HTTPS

## Prerequisites

- Docker and Docker Compose installed
- **mkcert** installed on your host system: `brew install mkcert`
- Make sure ports 3000, 5432, and 8000 are available

## Quick Start

1. **Setup SSL certificates (one-time):**
   ```bash
   ./setup-ssl.sh
   ```
   This script will:
   - Check if mkcert is installed
   - Install the mkcert CA in your system trust store
   - Generate SSL certificates that your browser will trust

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend (HTTPS): https://localhost:3000
   - Backend API (HTTPS): https://localhost:8000
   - PostgreSQL: localhost:5432

✅ **No more browser certificate warnings!** The certificates are generated on
your host system and trusted by your browser.

## Environment Variables

The setup uses the following default environment variables:

- `POSTGRES_DB=wordy`
- `POSTGRES_USER=wordy_user`
- `POSTGRES_PASSWORD=wordy_password`
- `DEBUG=1`

You can override these by creating a `.env` file or modifying the
`docker-compose.yml`.

## SSL Certificates

SSL certificates are generated on your host system using mkcert and mounted into
the Docker containers:

- Certificates are generated on the host using `./setup-ssl.sh`
- Stored in the `ssl/` directory and mounted to containers
- Trusted by your browser (no certificate warnings!)
- The frontend and backend both run on HTTPS for Office Add-in compatibility

## Database

The PostgreSQL database persists data in a Docker volume called `postgres_data`.
To reset the database:

```bash
docker-compose down -v
docker-compose up --build
```

## Development

For development, the containers are set up with volume mounts so changes are
reflected immediately:

- Backend: Changes to Python files trigger Django's auto-reload
- Frontend: Changes to React/TypeScript files trigger Vite's hot reload

## Useful Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Run Django commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py collectstatic

# Install frontend dependencies
docker-compose exec frontend pnpm install [package_name]

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose build [service_name]
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 3000, 8000, and 5432 are not in use
2. **SSL issues**: The mkcert certificates are generated automatically, but you
   may need to install the CA on your host system for browser trust
3. **Database connection**: Ensure the database service is healthy before the
   backend starts (handled by healthcheck)

## Production Notes

This setup is optimized for development. For production:

- Use environment variables for secrets
- Use a reverse proxy (nginx)
- Enable SSL properly with real certificates
- Set `DEBUG=False`
- Use a production WSGI server like gunicorn
