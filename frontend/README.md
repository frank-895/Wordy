# WordAI Frontend

This is the frontend for the WordAI Django application, built with:

- **Vite** - Fast build tool and dev server
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **pnpm** - Fast, disk space efficient package manager

## Setup

The frontend is already configured and integrated with Django via `django-vite`.

### Development

To start the development server:

```bash
cd frontend
pnpm dev
```

This will start the Vite dev server on `http://localhost:5173` with hot module
replacement (HMR).

### Building for Production

To build the frontend for production:

```bash
cd frontend
pnpm build
```

The built files will be output to `dist/` and Django will serve them in
production mode.

### Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles with TailwindCSS
├── dist/                # Build output (generated)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

### Django Integration

The frontend is integrated with Django using `django-vite`. The Django template
at `wordAI/templates/base.html` loads the Vite assets and provides a `#root`
element for React to mount to.

### API Integration

The React app communicates with Django via the `/prompts/` API endpoints. CSRF
tokens are automatically handled for API requests.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm type-check` - Type check without building
