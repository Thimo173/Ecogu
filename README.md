# ECOGU Open Innovation Platform

Full-stack app to submit, vote and progress sustainability ideas (plastic / wood / paper) through a Stage-Gate workflow.

## Stack
- Node.js + Express
- SQLite (via `better-sqlite3`)
- Vanilla HTML / CSS / JS

## Run locally
```bash
npm install
node server.js
```
Open http://localhost:3000

## Pages
- `/index.html` — dashboard: list, vote, comment, change stage
- `/submit.html` — submit a new idea

## API
| Method | Route | Body | Description |
|---|---|---|---|
| GET  | `/ideas` | — | List all ideas |
| POST | `/ideas` | `{title, description, category, impact}` | Create idea |
| POST | `/vote/:id` | — | Increment vote |
| POST | `/status/:id` | `{status}` | Admin: change stage |
| GET  | `/comments/:id` | — | List comments for idea |
| POST | `/comments` | `{idea_id, text}` | Add comment |

Stages: `Submitted`, `Review`, `Selected`, `Prototype`, `Implemented`.
Categories: `plastic`, `wood`, `paper`.
