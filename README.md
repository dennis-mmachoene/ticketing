# TicketVault — Professional Event Ticketing Platform

A full-stack, portfolio-grade event ticketing platform. Organizers create and sell tickets, attendees purchase and receive them by email, and staff validate entry via QR code scanning.

---

## Tech Stack

| Layer      | Technology                                 |
|------------|--------------------------------------------|
| Frontend   | React 18, Vite, TailwindCSS, Recharts      |
| Backend    | Node.js, Express.js, MongoDB (Mongoose)    |
| Auth       | JWT + bcrypt                               |
| Tickets    | PDFKit (PDF generation), qrcode (QR)       |
| Email      | Nodemailer                                 |
| AI Design  | Google Gemini (ticket color palette)       |
| Storage    | Local disk (uploads/)                      |

---

## Project Structure

```
ticketing/
├── server/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── middleware/       # JWT auth, role guards
│   │   ├── models/          # User, Event, Order, Ticket
│   │   ├── routes/          # auth, events, orders, scanner, admin
│   │   ├── services/        # PDF, QR, email, AI design
│   │   ├── uploads/         # posters/ and tickets/ (auto-created)
│   │   ├── index.js         # Express app entry
│   │   └── seed.js          # Demo data seeder
│   └── package.json
│
└── client/                  # React + Vite SPA
    ├── src/
    │   ├── components/      # AppLayout, PublicNav, EventCard, UI lib
    │   ├── context/         # AuthContext
    │   ├── pages/           # All pages by role
    │   ├── services/        # Axios API layer
    │   ├── utils/           # Formatters and helpers
    │   └── App.jsx          # Router
    └── package.json
```

---

## Prerequisites

- Node.js >= 18
- MongoDB running locally or MongoDB Atlas URI
- (Optional) Gmail App Password for real email delivery
- (Optional) Google Gemini API key for AI ticket design

---

## Setup

### 1. Clone and install dependencies

```bash
# Backend
cd ticketing/server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure environment

```bash
cd ticketing/server
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ticketing
JWT_SECRET=your_super_secret_key_change_this

# Email — leave blank to skip email delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# AI design — optional, falls back gracefully
GEMINI_API_KEY=your_gemini_api_key

CLIENT_URL=http://localhost:5173
```

### 3. Seed the database

```bash
cd ticketing/server
npm run seed
```

This creates demo accounts and 5 realistic events.

### 4. Start the servers

```bash
# Terminal 1 — Backend
cd ticketing/server
npm run dev

# Terminal 2 — Frontend
cd ticketing/client
npm run dev
```

Open: **http://localhost:5173**

---

## Demo Accounts

| Role       | Email                  | Password  |
|------------|------------------------|-----------|
| Admin      | admin@demo.com         | admin123  |
| Organizer  | organizer@demo.com     | demo123   |
| Scanner    | scanner@demo.com       | demo123   |
| Buyer      | buyer@demo.com         | demo123   |

---

## Features by Role

### Attendee
- Browse and search events
- Filter by category, city, name
- View event detail page with poster and ticket tiers
- Purchase tickets (demo payment mode)
- Receive ticket PDF via email
- Download ticket from "My Tickets" page
- View all orders and ticket statuses

### Organizer
- Multi-step event creation (Basic Info, Location, Tickets, Media)
- Up to 5 ticket tiers per event with individual pricing
- Upload event poster (used in page and ticket design)
- Publish/draft workflow
- Analytics dashboard: sales chart, revenue, capacity bar, tier breakdown
- Invite team members (scanner/event manager roles)

### Scanner Staff
- Mobile-friendly QR scanner using device camera
- Instant validation with VALID / ALREADY USED / INVALID result
- Attendees list with search and status filter
- Single-scan guarantee (camera stops after each scan)

### Admin
- System statistics: users, events, orders, revenue
- User management: view all users, suspend/activate accounts
- Event management: feature/unfeature events, suspend events
- Users by role and events by status breakdown charts

---

## API Reference

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/change-password

GET    /api/events                    (public, paginated)
GET    /api/events/:slug              (public)
POST   /api/events                    (organizer)
PUT    /api/events/:id                (organizer/manager)
PUT    /api/events/:id/publish        (organizer)
GET    /api/events/organizer/my-events
GET    /api/events/:id/analytics      (organizer/manager)
POST   /api/events/:id/team           (organizer)

POST   /api/orders                    (public with optional auth)
GET    /api/orders/my-orders          (authenticated)
GET    /api/orders/:orderId
GET    /api/orders/ticket/:ticketId/download

POST   /api/scanner/validate          (scanner roles)
GET    /api/scanner/events
GET    /api/scanner/events/:id/attendees

GET    /api/admin/stats               (admin)
GET    /api/admin/users               (admin)
PUT    /api/admin/users/:id/suspend   (admin)
PUT    /api/admin/users/:id/activate  (admin)
GET    /api/admin/events              (admin)
PUT    /api/admin/events/:id/suspend  (admin)
PUT    /api/admin/events/:id/feature  (admin)
```

---

## Ticket Generation

Tickets are generated as 600×300px PDF files using PDFKit:

1. **AI-assisted design** — On event creation, Gemini generates a colour palette matching the event category. This palette colours the ticket background, accents, and layout.
2. **Fallback design** — Category-specific dark palettes are used when no Gemini API key is set (no functionality degradation).
3. **QR stub** — Right panel contains the validation QR code encoding the ticket's unique `validationToken`.
4. **PDF served** — PDFs are stored in `server/src/uploads/tickets/` and downloadable via API.

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT with 7-day expiry
- Role-based access control on all protected routes
- Input validation via express-validator
- CORS restricted to CLIENT_URL
- Rate limiting: 200 req/15min globally, 20 req/15min on auth routes
- Uploaded files: type-checked and size-limited (5MB)

---

## Production Notes

- Replace `JWT_SECRET` with a strong random string (min 64 chars)
- Use MongoDB Atlas for cloud database
- Use a real SMTP provider (SendGrid, Mailgun, or Gmail App Password)
- Serve uploaded files from a CDN (S3 + CloudFront recommended)
- Add `NODE_ENV=production` to disable verbose error messages
- Consider adding Redis for session caching on high-traffic deployments
