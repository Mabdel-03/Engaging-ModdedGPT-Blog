(function () {
  "use strict";

  var statusEl = document.getElementById("auth-callback-status");
  var config = window.LEADERBOARD_CONFIG || {};
  var supabaseUrl = (config.supabaseUrl || "").trim();
  var supabaseAnonKey = (config.supabaseAnonKey || "").trim();

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message;
  }

  if (!supabaseUrl || !supabaseAnonKey || !window.supabase) {
    setStatus("Auth callback is not configured correctly.");
    return;
  }

  var client = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  async function waitForSession(maxWaitMs) {
    var start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      var result = await client.auth.getSession();
      if (result.data && result.data.session && result.data.session.user) {
        return result.data.session;
      }
      await new Promise(function (resolve) {
        setTimeout(resolve, 250);
      });
    }
    return null;
  }

  async function main() {
    setStatus("Completing authentication...");
    var session = await waitForSession(5000);
    if (!session) {
      setStatus("No session found. Please return to the leaderboard and sign in again.");
      return;
    }

    setStatus("Authentication complete. Redirecting...");
    var base = window.SITE_BASEURL || "";
    window.location.replace(window.location.origin + base + "/leaderboard/");
  }

  main().catch(function (error) {
    setStatus("Auth callback failed: " + (error && error.message ? error.message : "Unknown error"));
  });
})();
