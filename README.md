# HomeGameHero

A web application for organizing and managing poker home games.

## Project Structure

This is a monorepo containing both frontend and backend applications:

```
homegamehero/
├── backend/          # Node.js Express API with TypeScript
├── frontend/         # React application with TypeScript and Vite
└── package.json      # Root package.json for monorepo management
```

## Prerequisites

- Node.js 18+ (see `.nvmrc`)
- npm 9+

## Setup

1. Install dependencies for the entire monorepo:
```bash
npm install
```

2. Create environment variables:
```bash
cp backend/.env.example backend/.env
```

3. Start development servers:
```bash
npm run dev
```

This will start:
- Backend API at http://localhost:3001
- Frontend dev server at http://localhost:5173

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend
- `npm run lint` - Run ESLint on both projects
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Backend Scripts
- `npm run dev:backend` - Start backend in development mode
- `npm run build:backend` - Build backend
- `npm run lint:backend` - Lint backend code

### Frontend Scripts
- `npm run dev:frontend` - Start frontend in development mode
- `npm run build:frontend` - Build frontend
- `npm run lint:frontend` - Lint frontend code

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- Winston for logging
- Helmet for security
- CORS enabled

### Frontend
- React 18
- TypeScript
- Vite for build tooling
- React Router for navigation
- Vitest for testing

## Development

The project uses:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Concurrent development servers

The frontend proxy is configured to forward `/api` requests to the backend server.