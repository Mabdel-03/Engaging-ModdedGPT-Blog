---
layout: default
title: MIT NanoGPT Speedrun Leaderboard
permalink: /leaderboard/
---

# MIT NanoGPT Speedrun Leaderboard

Leaderboard for Poggio Lab experiments on Engaging. Anyone can view records. Sign in with Google and receive admin approval to submit runs. For submissions, paste your `.out` SLURM log content; no log URL is required. Runs also track GPU hardware and can be filtered by hardware.

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

  <form id="run-form">
    <label for="run-log-paste">Paste SLURM Log Output</label>
    <textarea id="run-log-paste" rows="8" placeholder="Paste your .out log here, then click Parse Log for Record Time." required></textarea>
    <div class="leaderboard-submit-actions">
      <button id="parse-log-btn" class="button secondary" type="button">Parse Log for Record Time</button>
    </div>
    <p id="parse-status" class="muted"></p>

    <label for="time-to-328">Record Time (seconds)</label>
    <input id="time-to-328" type="number" min="0" step="0.01" placeholder="214.83" required />

    <label for="run-description">Description</label>
    <input id="run-description" type="text" placeholder="Example: Added sparse attention gate + tuned batch schedule" required />

    <label for="gpu-type">GPU Type</label>
    <select id="gpu-type" required>
      <option value="">Select GPU type</option>
      <option value="h100">h100</option>
      <option value="h200">h200</option>
      <option value="a100">a100</option>
      <option value="l40s">l40s</option>
      <option value="rtx6000">rtx6000</option>
      <option value="other">other</option>
    </select>

    <label for="gpu-count">Number of GPUs</label>
    <input id="gpu-count" type="number" min="1" step="1" placeholder="2" required />

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
  <label for="contributor-filter">Filter by contributor</label>
  <input id="contributor-filter" type="text" placeholder="e.g. jyoo or abrown" />
  <label for="hardware-filter-type">Filter by GPU type</label>
  <select id="hardware-filter-type">
    <option value="">Any GPU type</option>
    <option value="h100">h100</option>
    <option value="h200">h200</option>
    <option value="a100">a100</option>
    <option value="l40s">l40s</option>
    <option value="rtx6000">rtx6000</option>
    <option value="other">other</option>
  </select>
  <label for="hardware-filter-count">Filter by GPU count</label>
  <input id="hardware-filter-count" type="number" min="1" step="1" placeholder="Any count" />
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
