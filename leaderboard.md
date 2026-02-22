---
layout: default
title: MIT NanoGPT Speedrun Leaderboard
permalink: /leaderboard/
---

# MIT NanoGPT Speedrun Leaderboard

Leaderboard for Poggio Lab experiments on Engaging. Sign in with Google to view records; admin approval is required before you can submit runs.

<section id="leaderboard-auth" class="card">
  <h2>Sign In</h2>
  <p class="muted">Sign in with Google to access your account state and submission permissions.</p>

  <div class="leaderboard-auth-actions">
    <button id="google-signin-btn" class="button" type="button">Sign In with Google</button>
    <button id="signout-btn" class="button secondary hidden" type="button">Sign Out</button>
  </div>

  <p id="auth-status" class="muted leaderboard-auth-status"></p>
  <p id="approval-status" class="muted hidden leaderboard-approval-status"></p>
</section>

<section id="submission-section" class="card hidden">
  <h2>Submit a Run</h2>
  <p class="muted">Use the same fields as the public record table.</p>

  <form id="run-form">
    <label for="time-to-328">Record Time (seconds)</label>
    <input id="time-to-328" type="number" min="0" step="0.01" placeholder="214.83" required />

    <label for="run-description">Description</label>
    <input id="run-description" type="text" placeholder="Example: Added sparse attention gate + tuned batch schedule" required />

    <label for="run-log-url">Log URL</label>
    <input id="run-log-url" type="url" placeholder="https://..." required />

    <label for="contributors">Contributors (comma-separated, optional)</label>
    <input id="contributors" type="text" placeholder="jyoo, abrown, cchen" />

    <div class="leaderboard-submit-actions">
      <button id="submit-run-btn" class="button" type="submit">Submit Run</button>
    </div>
  </form>

  <p id="submit-status" class="muted"></p>
</section>

<section id="admin-section" class="card hidden">
  <h2>Admin: Account Approvals</h2>
  <p class="muted">Approve or reject accounts before users can submit runs.</p>
  <div id="pending-approvals-wrap"></div>
</section>

<section class="card">
  <h2>Public Record Table</h2>
  <div id="leaderboard-table-wrap"></div>
</section>

<script>
  window.LEADERBOARD_CONFIG = {
    supabaseUrl: "{{ site.supabase_url | default: '' }}",
    supabaseAnonKey: "{{ site.supabase_anon_key | default: '' }}"
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="{{ '/assets/js/leaderboard.js' | relative_url }}" defer></script>
