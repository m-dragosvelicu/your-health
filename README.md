# Your Health - Personal Health Tracker

A modern, full-stack health tracking application that helps users manage medications, track lab results, and monitor their health over time.

## Features

### Medications Management
- Create and manage medications with dosage, frequency, and scheduled times
- Track daily medication adherence with visual indicators
- **Mark doses as taken** with timestamps
- **Skip doses** with undo capability
- **Snooze reminders** (10, 30, or 60 minutes) with auto-refresh
- **Adherence tracking** with weekly and all-time percentages
- Color-coded status: green (≥80%), amber (50-79%), red (<50%)

### Lab Results
- **AI-powered PDF import** - Upload any lab report and automatically extract results using Google Gemini
- Supports any lab provider format
- Preview and edit parsed values before saving
- **Interactive charts** showing test values over time with reference ranges
- Time period filters (Last, 3 months, 6 months, 12 months, All)
- Track value changes with percentage indicators
- Status indicators (normal, high, low) based on reference ranges

### Dashboard
- Overview of health status
- Quick access to medications and lab results
- Lab values chart widget

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Frontend:** React 19, Tailwind CSS 4, Framer Motion
- **Backend:** tRPC 11 + React Query 5
- **Database:** PostgreSQL with Prisma 6 ORM
- **Authentication:** NextAuth.js v5 with Google OAuth and email/password
- **AI:** Google Gemini 2.5 Pro for lab report parsing
- **Charts:** Recharts
- **Validation:** Zod

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Google OAuth credentials (optional)
- Google Gemini API key (for lab import feature)

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/health_tracker"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (optional)
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Google Gemini (for lab parsing)
GEMINI_API_KEY="your-gemini-api-key"
```

### Installation

```bash
# Install dependencies
npm install

# Apply the database schema (choose one)
npm run db:generate
# or
npm run db:push

# Seed reference data (biomarkers, etc.)
npm run db:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # REST and tRPC endpoints
├── features/              # Feature modules
│   ├── auth/              # Authentication logic
│   ├── medications/       # Medication tracking
│   └── labs/              # Lab results management
├── shared/                # Shared utilities and components
│   ├── components/        # UI components
│   └── server/            # Server utilities, auth, database
└── trpc/                  # tRPC client configuration
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Create/apply a new migration (dev) |
| `npm run db:migrate` | Apply migrations in deploy environments |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Populate canonical biomarkers |
| `npm run db:studio` | Open Prisma Studio |

## Authentication

The app supports multiple authentication methods:
- **Google OAuth** - Sign in with Google account
- **Email/Password** - Traditional credentials with password reset via email

Security features include rate limiting, bcrypt password hashing, and JWT sessions.

## License

MIT License - see [LICENSE](LICENSE) for details.
