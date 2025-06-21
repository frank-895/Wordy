# Wordy

A Django web application with a React frontend for AI-powered text generation
using OpenAI's GPT models.

## Architecture

- **Backend**: Django 5.2.3 with Django REST Framework
- **Frontend**: React + TypeScript + TailwindCSS + Vite
- **Integration**: django-vite for seamless frontend/backend integration
- **Package Manager**: pnpm for frontend dependencies

## Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- pnpm (install with `npm install -g pnpm`)

### Backend Setup

1. Clone the repository and navigate to the project:

```bash
git clone <repository-url>
cd wordy
```

2. Create a virtual environment and activate it:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory and add your OpenAI API key:

```bash
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

5. Run Django migrations:

```bash
cd Wordy
python manage.py migrate
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the frontend:

```bash
pnpm build
```

## Development

### Running the Development Servers

For development, you'll need to run both the Django server and the Vite dev
server:

1. **Start the Django server** (in one terminal):

```bash
cd Wordy
python manage.py runserver
```

2. **Start the Vite dev server** (in another terminal):

```bash
cd frontend
pnpm dev
```

The application will be available at:

- Django server: `http://localhost:8000`
- Vite dev server: `http://localhost:5173` (with HMR)

### Production

For production, build the frontend and Django will serve the static files:

```bash
cd frontend
pnpm build
cd ../Wordy
python manage.py collectstatic
python manage.py runserver
```

## Project Structure

```
wordy/
├── Wordy/                 # Django project
│   ├── Wordy/            # Django settings
│   ├── prompts/           # API app for AI prompts
│   ├── templates/         # Django templates
│   └── manage.py
├── frontend/              # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── vite.config.ts
│   └── package.json
├── requirements.txt       # Python dependencies
└── .env                  # Environment variables
```

## API Endpoints

- `GET /` - Serves the React frontend
- `POST /prompts/simple/` - Process AI prompts
- `POST /prompts/generate/` - Alternative endpoint for prompts
- `GET /admin/` - Django admin interface

## Technologies Used

### Backend

- Django 5.2.3
- Django REST Framework
- OpenAI Python SDK
- python-dotenv

### Frontend

- React 19.1.0
- TypeScript 5.8.3
- TailwindCSS 4.1.10
- Vite 6.3.5
- pnpm

### Integration

- django-vite 3.1.0

## Features

- Modern React frontend with TypeScript
- TailwindCSS for styling
- Hot Module Replacement (HMR) in development
- Production-ready build optimization
- Django REST API integration
- CSRF protection for API calls
- Responsive design
