# RoomOS

RoomOS is a responsive roommate maintenance and expense-management application. It includes item-level expense splitting, settlements, reports, member administration, CSV import/export, JSON backups, theme settings, and role-protected authentication.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Seeded accounts:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `yuvaraj` | `yuvaraj@123` |
| Member | `anand` | `anand@123` |
| Member | `varshith` | `varshith@123` |
| Member | `mahendra` | `mahendra@123` |

## Verification

```bash
npm run lint
npm run build
npm start
```

## Data and deployment

Local data is stored in `data/roomos-data.json`, which is created automatically from seed data on first use. Backup and CSV export are available from the application.

Set a strong, unique `SESSION_SECRET` in every deployed environment. The current JSON adapter writes to `/tmp` on Vercel, where data is ephemeral; connect the isolated storage layer to a persistent database before using a serverless deployment for real household records.
