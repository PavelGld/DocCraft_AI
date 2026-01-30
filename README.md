# DocCraft AI

A web-based collaborative document creation platform with AI assistance. Features a three-panel layout inspired by modern code editors: an AI chat panel for document editing assistance, a code editor for writing documents in HTML/LaTeX/RTF formats, and a real-time preview panel.

## Features

- **Three-Panel Resizable Layout**: Chat (35%) | Editor (40%) | Preview (25%)
- **AI-Powered Editing**: Ask the AI to write, edit, or improve your documents
- **Multiple Document Formats**: HTML, LaTeX, and RTF support with real-time preview
- **Multiple AI Providers**: OpenAI GPT-4o, Google Gemini, Alibaba Qwen
- **File Attachments**: Upload files to provide context to the AI assistant
- **Document Management**: Create, save, and manage multiple documents
- **Export Functionality**: Download documents in their native format
- **Dark Theme**: Professional dark-first design

## Security

- **API Keys**: Stored only in browser localStorage, never persisted to server database
- **Preview Sandbox**: HTML/RTF content renders in fully sandboxed iframe (no scripts, no same-origin access)
- **LaTeX Preview**: LaTeX content is HTML-escaped before rendering; scripts enabled only for KaTeX math library
- **Server Protection**: LLM responses are displayed in client-side preview only, cannot execute server-side code

## Tech Stack

### Frontend
- React + TypeScript
- Vite (bundler)
- Tailwind CSS + Shadcn/ui
- TanStack React Query

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Drizzle ORM

### AI Integration
- OpenAI SDK (compatible with multiple providers)
- SSE streaming for real-time responses

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- API key from OpenAI, Google AI, or Alibaba Cloud (optional - Replit provides default)

## Local Development

### 1. Clone the repository

```bash
git clone <repository-url>
cd doccraft-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/doccraft
SESSION_SECRET=your-session-secret-here

# Optional: Default AI provider (leave empty to require user configuration)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 4. Set up the database

```bash
npm run db:push
```

### 5. Start the development server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Server Deployment

### Standard Deployment

#### 1. Build the application

```bash
npm run build
```

#### 2. Set environment variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/doccraft
SESSION_SECRET=your-secure-session-secret

# Optional AI configuration
OPENAI_API_KEY=sk-your-openai-key
OPENAI_BASE_URL=https://api.openai.com/v1
```

#### 3. Run database migrations

```bash
npm run db:push
```

#### 4. Start the production server

```bash
npm start
```

### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t doccraft-ai .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e SESSION_SECRET=... \
  doccraft-ai
```

## Configuration

### AI Provider Settings

Users can configure their AI provider in the Settings dialog (gear icon):

| Provider | Base URL | Models |
|----------|----------|--------|
| OpenAI | `https://api.openai.com/v1` | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| Google | `https://generativelanguage.googleapis.com/v1beta/openai` | gemini-1.5-pro, gemini-2.0-flash |
| Alibaba | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen-max, qwen-plus, qwen-turbo |

### Supported File Formats

**Document Editing:**
- HTML - Full HTML with syntax highlighting
- LaTeX - Math rendering via KaTeX
- RTF - Rich Text Format (basic support)

**File Uploads:**
- Upload endpoint (/api/upload): .txt, .html, .tex, .rtf, .doc, .docx
- Chat attachments: .txt, .html, .js, .py, .docx (content sent to AI as context)
- Word documents: converted to text via Mammoth library

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/:id` | Get document by ID |
| POST | `/api/documents` | Create new document |
| PATCH | `/api/documents/:id` | Update document |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/documents/:id/messages` | Get chat history |
| POST | `/api/documents/:id/chat` | Send message to AI (SSE) |
| POST | `/api/upload` | Upload file for AI context |
| POST | `/api/export` | Export document |

## Project Structure

```
doccraft-ai/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Backend Express server
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── vite.ts             # Vite integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle schema + Zod validation
└── package.json
```

## License

MIT
