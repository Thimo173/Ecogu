// ECOGU frontend - talks to the Express API
const STAGES = ["Submitted", "Review", "Selected", "Prototype", "Implemented"];

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -------- Dashboard --------
async function loadIdeas() {
  const container = document.getElementById("ideas");
  if (!container) return;
  try {
    const ideas = await api("/ideas");
    if (ideas.length === 0) {
      container.innerHTML = `<p class="muted">No ideas yet. <a href="submit.html">Submit the first one →</a></p>`;
      return;
    }
    container.innerHTML = ideas.map(renderIdea).join("");
    ideas.forEach((i) => loadComments(i.id));
  } catch (e) {
    container.innerHTML = `<p class="error">${escapeHtml(e.message)}</p>`;
  }
}

function renderIdea(idea) {
  const stageOptions = STAGES.map(
    (s) => `<option value="${s}" ${s === idea.status ? "selected" : ""}>${s}</option>`
  ).join("");
  return `
    <article class="card idea" data-id="${idea.id}">
      <div class="idea-head">
        <span class="badge badge-${idea.category}">${idea.category}</span>
        <span class="stage">${escapeHtml(idea.status)}</span>
      </div>
      <h3>${escapeHtml(idea.title)}</h3>
      <p>${escapeHtml(idea.description)}</p>
      <p class="impact"><strong>Impact:</strong> ${escapeHtml(idea.impact)}</p>

      <div class="row">
        <button class="vote" onclick="vote(${idea.id})">▲ Vote (<span id="votes-${idea.id}">${idea.votes}</span>)</button>
        <label class="admin">
          Stage:
          <select onchange="updateStage(${idea.id}, this.value)">${stageOptions}</select>
        </label>
      </div>

      <div class="comments">
        <h4>Comments</h4>
        <ul id="comments-${idea.id}"><li class="muted">Loading…</li></ul>
        <form onsubmit="addComment(event, ${idea.id})" class="comment-form">
          <input name="text" placeholder="Write a comment…" required />
          <button type="submit">Post</button>
        </form>
      </div>
    </article>
  `;
}

async function vote(id) {
  try {
    const idea = await api(`/vote/${id}`, { method: "POST" });
    document.getElementById(`votes-${id}`).textContent = idea.votes;
  } catch (e) {
    alert(e.message);
  }
}

async function updateStage(id, status) {
  try {
    const idea = await api(`/status/${id}`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    const card = document.querySelector(`.idea[data-id="${id}"] .stage`);
    if (card) card.textContent = idea.status;
  } catch (e) {
    alert(e.message);
  }
}

async function loadComments(ideaId) {
  const list = document.getElementById(`comments-${ideaId}`);
  if (!list) return;
  try {
    const comments = await api(`/comments/${ideaId}`);
    list.innerHTML = comments.length
      ? comments.map((c) => `<li>${escapeHtml(c.text)}</li>`).join("")
      : `<li class="muted">No comments yet.</li>`;
  } catch (e) {
    list.innerHTML = `<li class="error">${escapeHtml(e.message)}</li>`;
  }
}

async function addComment(event, ideaId) {
  event.preventDefault();
  const form = event.target;
  const text = form.text.value.trim();
  if (!text) return;
  try {
    await api("/comments", {
      method: "POST",
      body: JSON.stringify({ idea_id: ideaId, text }),
    });
    form.reset();
    loadComments(ideaId);
  } catch (e) {
    alert(e.message);
  }
}

// -------- Submit page --------
function bindSubmitForm() {
  const form = document.getElementById("idea-form");
  if (!form) return;
  const msg = document.getElementById("form-msg");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Submitting…";
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await api("/ideas", { method: "POST", body: JSON.stringify(data) });
      msg.textContent = "✅ Idea submitted! Redirecting…";
      setTimeout(() => (window.location.href = "index.html"), 800);
    } catch (err) {
      msg.textContent = "❌ " + err.message;
    }
  });
}
