---
layout: default
title: Auth Callback
permalink: /auth/callback/
---

<section class="card">
  <h1>Signing you in...</h1>
  <p id="auth-callback-status" class="muted">Completing authentication.</p>
</section>

<script>
  window.LEADERBOARD_CONFIG = {
    supabaseUrl: "{{ site.supabase_url | default: '' }}",
    supabaseAnonKey: "{{ site.supabase_anon_key | default: '' }}"
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="{{ '/assets/js/auth-callback.js' | relative_url }}" defer></script>
