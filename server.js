// ECOGU Open Innovation Platform - Express + SQLite backend
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Database setup ----------
const db = new Database(path.join(__dirname, "ecogu.db"));
db.pragma("journal_mode = WAL");

const VALID_CATEGORIES = ["plastic", "wood", "paper"];
const VALID_STAGES = ["Submitted", "Review", "Selected", "Prototype", "Implemented"];

db.exec(`
  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    impact TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Submitted'
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idea_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
  );
`);

// ---------- Middleware ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Routes ----------

// GET /ideas - list all ideas
app.get("/ideas", (req, res) => {
  const ideas = db.prepare("SELECT * FROM ideas ORDER BY id DESC").all();
  res.json(ideas);
});

// POST /ideas - submit new idea
app.post("/ideas", (req, res) => {
  const { title, description, category, impact } = req.body || {};
  if (!title || !description || !category || !impact) {
    return res.status(400).json({ error: "title, description, category and impact are required" });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `category must be one of ${VALID_CATEGORIES.join(", ")}` });
  }
  const info = db
    .prepare("INSERT INTO ideas (title, description, category, impact) VALUES (?, ?, ?, ?)")
    .run(title, description, category, impact);
  const idea = db.prepare("SELECT * FROM ideas WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(idea);
});

// POST /vote/:id - increment votes
app.post("/vote/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare("UPDATE ideas SET votes = votes + 1 WHERE id = ?").run(id);
  if (result.changes === 0) return res.status(404).json({ error: "Idea not found" });
  const idea = db.prepare("SELECT * FROM ideas WHERE id = ?").get(id);
  res.json(idea);
});

// POST /status/:id - admin updates stage
app.post("/status/:id", (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!VALID_STAGES.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${VALID_STAGES.join(", ")}` });
  }
  const result = db.prepare("UPDATE ideas SET status = ? WHERE id = ?").run(status, id);
  if (result.changes === 0) return res.status(404).json({ error: "Idea not found" });
  const idea = db.prepare("SELECT * FROM ideas WHERE id = ?").get(id);
  res.json(idea);
});

// GET /comments/:id - list comments for an idea
app.get("/comments/:id", (req, res) => {
  const id = Number(req.params.id);
  const comments = db
    .prepare("SELECT * FROM comments WHERE idea_id = ? ORDER BY id ASC")
    .all(id);
  res.json(comments);
});

// POST /comments - add a comment { idea_id, text }
app.post("/comments", (req, res) => {
  const { idea_id, text } = req.body || {};
  if (!idea_id || !text) {
    return res.status(400).json({ error: "idea_id and text are required" });
  }
  const idea = db.prepare("SELECT id FROM ideas WHERE id = ?").get(Number(idea_id));
  if (!idea) return res.status(404).json({ error: "Idea not found" });
  const info = db
    .prepare("INSERT INTO comments (idea_id, text) VALUES (?, ?)")
    .run(Number(idea_id), text);
  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(comment);
});

app.listen(PORT, () => {
  console.log(`ECOGU Open Innovation Platform running at http://localhost:${PORT}`);
});
