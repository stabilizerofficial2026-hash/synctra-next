// Import/use this only after your existing Supabase client is initialized.
// Example: initModeratorPanel(supabase)
export async function initModeratorPanel(supabase) {
  const panel = document.getElementById("synctra-moderator-panel");
  const status = document.getElementById("mod-status");
  const list = document.getElementById("mod-report-list");
  const refresh = document.getElementById("mod-refresh");
  if (!panel || !status || !list || !refresh) return;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  async function loadQueue() {
    status.textContent = "Checking moderator access…";
    list.replaceChildren();
    const { data, error } = await supabase.rpc("synctra_moderation_queue");
    if (error) {
      status.textContent = "Moderator access unavailable. This account may not have moderator permission.";
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    status.textContent = `${data.length} open/reviewing/appealed report(s).`;
    if (!data.length) {
      list.textContent = "No reports waiting for review.";
      return;
    }
    list.innerHTML = data.map(r => `
      <article class="moderation-report" data-id="${escapeHtml(r.report_id)}">
        <h3>${escapeHtml(r.target_type)} report · ${escapeHtml(r.report_status)}</h3>
        <p>${escapeHtml(r.reason)}</p>
        <small>Submitted: ${escapeHtml(new Date(r.created_at).toLocaleString())}</small>
        <label>Moderator note
          <textarea class="mod-note" maxlength="2000" rows="3" placeholder="Explain the decision"></textarea>
        </label>
        <div class="mod-actions">
          <button type="button" data-status="reviewing">Mark reviewing</button>
          <button type="button" data-status="actioned">Take action</button>
          <button type="button" data-status="dismissed">Dismiss</button>
        </div>
      </article>`).join("");
  }

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-status]");
    if (!button) return;
    const card = button.closest("[data-id]");
    const note = card.querySelector(".mod-note").value.trim();
    if (button.dataset.status !== "reviewing" && note.length < 5) {
      status.textContent = "Please enter a clear reason (at least 5 characters) before deciding.";
      return;
    }
    button.disabled = true;
    const { error } = await supabase.rpc("synctra_review_report", {
      p_report_id: card.dataset.id,
      p_status: button.dataset.status,
      p_note: note
    });
    button.disabled = false;
    status.textContent = error ? error.message : "Decision saved to the audit log.";
    if (!error) await loadQueue();
  });

  refresh.addEventListener("click", loadQueue);
  await loadQueue();
}
