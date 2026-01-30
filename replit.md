# DocCraft AI

## Overview

DocCraft AI is a web-based collaborative document creation platform with AI assistance. It features a three-panel layout inspired by Cursor/Replit: an AI chat panel for document editing assistance, a code editor for writing documents in HTML/LaTeX/RTF formats, and a real-time preview panel. The application supports document management, AI-powered content generation via OpenAI, and file upload capabilities for .doc/.docx files.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (dark/light mode support)
- **Layout**: Three-panel resizable layout using Shadcn's ResizablePanel components
  - Left panel (35%): AI chat interface
  - Center panel (40%): Code editor with syntax highlighting
  - Right panel (25%): Live document preview (HTML/LaTeX/RTF rendering)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/` prefix
- **File Processing**: Multer for file uploads, Mammoth for .docx conversion
- **Build System**: Custom build script using esbuild for server, Vite for client

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Key Tables**:
  - `users`: User authentication
  - `documents`: Document storage with title, content, format, timestamps
  - `chatMessages`: AI conversation history linked to documents
  - `conversations` / `messages`: General chat storage for AI integrations

### AI Integration
- **Provider**: OpenAI API (configurable via environment variables)
- **Features**: Chat completions for document assistance, streaming responses
- **Additional Capabilities**: Image generation, voice chat (via Replit AI integrations)

### Key Design Patterns
- **Shared Schema**: Database schema and Zod validation schemas shared between frontend and backend via `@shared/*` path alias
- **API Request Helper**: Centralized `apiRequest` function for consistent error handling
- **Component Organization**: UI primitives in `components/ui/`, feature components at `components/` root
- **Environment-based Configuration**: Development uses Vite dev server with HMR, production serves static files

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and migrations (`drizzle-kit` for schema management)
- **connect-pg-simple**: Session storage in PostgreSQL

### AI Services
- **OpenAI API**: Document assistance and chat (configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`)
- **Replit AI Integrations**: Voice chat, image generation, batch processing utilities

### Document Processing
- **Mammoth**: Convert .docx files to text/HTML for AI processing
- **KaTeX**: LaTeX math rendering in preview panel (loaded via CDN)

### Development Tools
- **Vite**: Frontend bundling with React plugin and HMR
- **esbuild**: Server bundling for production
- **TypeScript**: Type checking across full stack

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **Vaul**: Drawer component
- **cmdk**: Command palette