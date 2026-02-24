(function () {
  "use strict";

  var config = window.LEADERBOARD_CONFIG || {};
  var supabaseUrl = (config.supabaseUrl || "").trim();
  var supabaseAnonKey = (config.supabaseAnonKey || "").trim();

  var authStatusEl = document.getElementById("auth-status");
  var approvalStatusEl = document.getElementById("approval-status");
  var submitStatusEl = document.getElementById("submit-status");
  var parseStatusEl = document.getElementById("parse-status");
  var googleSignInBtn = document.getElementById("google-signin-btn");
  var signOutBtn = document.getElementById("signout-btn");
  var submissionSection = document.getElementById("submission-section");
  var adminSection = document.getElementById("admin-section");
  var pendingApprovalsWrap = document.getElementById("pending-approvals-wrap");
  var contributorFilterInput = document.getElementById("contributor-filter");
  var runForm = document.getElementById("run-form");
  var parseLogBtn = document.getElementById("parse-log-btn");
  var runLogPasteInput = document.getElementById("run-log-paste");
  var recordTimeInput = document.getElementById("time-to-328");
  var leaderboardTableWrap = document.getElementById("leaderboard-table-wrap");
  var allRunsCache = [];

  function setAuthStatus(message) {
    if (authStatusEl) authStatusEl.textContent = message;
  }

  function setSubmitStatus(message) {
    if (submitStatusEl) submitStatusEl.textContent = message;
  }

  function setParseStatus(message) {
    if (parseStatusEl) parseStatusEl.textContent = message;
  }

  function setApprovalStatus(message) {
    if (!approvalStatusEl) return;
    if (message) {
      approvalStatusEl.textContent = message;
      approvalStatusEl.classList.remove("hidden");
      return;
    }
    approvalStatusEl.textContent = "";
    approvalStatusEl.classList.add("hidden");
  }

  function renderInfoMessage(target, message) {
    target.innerHTML = "<p class='muted'>" + message + "</p>";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    setAuthStatus("Leaderboard is not configured yet. Add Supabase keys in site config.");
    renderInfoMessage(leaderboardTableWrap, "Leaderboard unavailable until Supabase is configured.");
    return;
  }

  var client = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  window._sb = client;

  function formatDate(iso) {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  function formatRecordTime(secondsValue) {
    if (secondsValue === null || secondsValue === undefined || secondsValue === "") return "-";
    var seconds = Number(secondsValue);
    if (Number.isNaN(seconds) || seconds <= 0) return "-";
    if (seconds >= 7200) {
      var totalSecondsHours = Math.round(seconds);
      var hours = Math.floor(totalSecondsHours / 3600);
      var minutesFromHours = Math.floor((totalSecondsHours % 3600) / 60);
      var remainderSecondsHours = totalSecondsHours % 60;
      return (
        hours +
        "h " +
        String(minutesFromHours).padStart(2, "0") +
        "m " +
        String(remainderSecondsHours).padStart(2, "0") +
        "s"
      );
    }
    if (seconds >= 120) {
      var totalSeconds = Math.round(seconds);
      var minutes = Math.floor(totalSeconds / 60);
      var remainderSeconds = totalSeconds % 60;
      return minutes + "m " + String(remainderSeconds).padStart(2, "0") + "s";
    }
    return seconds.toFixed(2) + " seconds";
  }

  async function loadRuns() {
    var result = await client
      .from("runs")
      .select("id, account_email, display_name, time_to_3_28_sec, run_description, run_log_url, contributors, created_at")
      .order("created_at", { ascending: false });

    if (result.error) {
      renderInfoMessage(leaderboardTableWrap, "Failed to load leaderboard: " + result.error.message);
      return;
    }

    allRunsCache = result.data || [];
    applyContributorFilter();
  }

  function runContributorsText(run) {
    return (run.contributors || "").toLowerCase().trim();
  }

  function applyContributorFilter() {
    var filterValue = (contributorFilterInput && contributorFilterInput.value ? contributorFilterInput.value : "").trim().toLowerCase();
    if (!filterValue) {
      renderLeaderboard(allRunsCache);
      return;
    }
    var filtered = allRunsCache.filter(function (run) {
      return runContributorsText(run).includes(filterValue);
    });
    renderLeaderboard(filtered);
  }

  function linkOrDash(url, label) {
    if (!url) return "-";
    return "<a href='" + url + "' target='_blank' rel='noopener noreferrer'>" + label + "</a>";
  }

  function parseRecordTimeFromLog(logText) {
    if (!logText || !logText.trim()) {
      return { ok: false, message: "Paste log content first." };
    }

    var lines = String(logText).split(/\r?\n/);
    var linePattern = /val_loss:([0-9]*\.?[0-9]+)\s+train_time:([0-9]+)ms/i;

    for (var i = 0; i < lines.length; i++) {
      var match = lines[i].match(linePattern);
      if (!match) continue;
      var valLoss = Number(match[1]);
      var trainMs = Number(match[2]);
      if (Number.isNaN(valLoss) || Number.isNaN(trainMs)) continue;
      if (valLoss <= 3.28) {
        return {
          ok: true,
          valLoss: valLoss,
          trainMs: trainMs,
          lineNumber: i + 1
        };
      }
    }

    return { ok: false, message: "No val_loss <= 3.28 found in log." };
  }

  function parseLogAndFillRecordTime() {
    var result = parseRecordTimeFromLog(runLogPasteInput ? runLogPasteInput.value : "");
    if (!result.ok) {
      setParseStatus(result.message);
      return;
    }

    var seconds = result.trainMs / 1000;
    if (recordTimeInput) {
      recordTimeInput.value = seconds.toFixed(2);
    }
    setParseStatus(
      "Parsed line " +
      result.lineNumber +
      ": val_loss " +
      result.valLoss.toFixed(4) +
      ", train_time " +
      result.trainMs +
      "ms (" +
      seconds.toFixed(2) +
      " seconds)."
    );
  }

  function renderLeaderboard(runs) {
    var ranked = runs
      .filter(function (run) {
        return run.time_to_3_28_sec !== null && run.time_to_3_28_sec !== undefined;
      })
      .sort(function (a, b) {
        var at = Number(a.time_to_3_28_sec);
        var bt = Number(b.time_to_3_28_sec);
        if (at !== bt) return at - bt;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    if (!ranked.length) {
      renderInfoMessage(leaderboardTableWrap, "No records yet.");
      return;
    }

    var rows = ranked
      .map(function (run, idx) {
        return (
          "<tr>" +
          "<td>" + (idx + 1) + "</td>" +
          "<td>" + formatRecordTime(run.time_to_3_28_sec) + "</td>" +
          "<td>" + (run.run_description || "-") + "</td>" +
          "<td>" + formatDate(run.created_at) + "</td>" +
          "<td>" + linkOrDash(run.run_log_url, "log") + "</td>" +
          "<td>" + (run.contributors || run.display_name || run.account_email || "-") + "</td>" +
          "</tr>"
        );
      })
      .join("");

    leaderboardTableWrap.innerHTML =
      "<table><thead><tr>" +
      "<th>#</th><th>Record time</th><th>Description</th><th>Date</th><th>Log</th><th>Contributors</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table>";
  }

  async function getSession() {
    var result = await client.auth.getSession();
    return result.data ? result.data.session : null;
  }

  async function isCurrentUserAdmin() {
    var result = await client.rpc("is_admin");
    if (result.error) {
      return { isAdmin: false, error: result.error.message || "Failed to verify admin status." };
    }
    return { isAdmin: !!result.data, error: null };
  }

  function userDisplayName(user) {
    return (
      (user && user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
      (user && user.email) ||
      null
    );
  }

  async function ensureProfile(session, isAdmin) {
    if (!session || !session.user || !(session.user.email || "").toLowerCase()) {
      return { ok: false, message: "Missing session email." };
    }
    var email = session.user.email.toLowerCase();
    var displayName = userDisplayName(session.user);
    var payload = {
      user_id: session.user.id,
      account_email: email,
      display_name: displayName
    };

    if (isAdmin) {
      payload.role = "admin";
      payload.approval_status = "approved";
      payload.approved_by = session.user.id;
      payload.approved_at = new Date().toISOString();
    }

    var upsertResult = await client.from("profiles").upsert(
      payload,
      { onConflict: "user_id" }
    );
    if (upsertResult.error) {
      return { ok: false, message: upsertResult.error.message };
    }
    return { ok: true };
  }

  async function fetchMyProfile(userId) {
    if (!userId) return null;
    var result = await client
      .from("profiles")
      .select("user_id, account_email, display_name, role, approval_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (result.error) return null;
    return result.data || null;
  }

  async function loadPendingApprovals() {
    if (!pendingApprovalsWrap) return;
    var result = await client
      .from("profiles")
      .select("user_id, account_email, display_name, created_at, approval_status")
      .in("approval_status", ["pending", "rejected"])
      .order("created_at", { ascending: true });

    if (result.error) {
      renderInfoMessage(pendingApprovalsWrap, "Failed to load approval queue: " + result.error.message);
      return;
    }

    var rowsData = result.data || [];
    if (!rowsData.length) {
      renderInfoMessage(pendingApprovalsWrap, "No pending or rejected accounts.");
      return;
    }

    var rows = rowsData
      .map(function (row) {
        var email = escapeHtml(row.account_email || "-");
        var name = escapeHtml(row.display_name || "-");
        var status = escapeHtml(row.approval_status || "pending");
        var uid = escapeHtml(row.user_id);
        return (
          "<tr>" +
          "<td>" + name + "</td>" +
          "<td>" + email + "</td>" +
          "<td>" + formatDate(row.created_at) + "</td>" +
          "<td>" + status + "</td>" +
          "<td>" +
          "<button class='button' type='button' data-approve='" + uid + "'>Approve</button> " +
          "<button class='button secondary' type='button' data-reject='" + uid + "'>Reject</button>" +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    pendingApprovalsWrap.innerHTML =
      "<table><thead><tr>" +
      "<th>Name</th><th>Email</th><th>Requested</th><th>Status</th><th>Action</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table>";
  }

  async function updateApproval(targetUserId, status) {
    var session = await getSession();
    if (!session || !session.user) {
      setAuthStatus("You must be signed in to moderate approvals.");
      return;
    }
    var adminState = await isCurrentUserAdmin();
    if (!adminState.isAdmin) {
      setAuthStatus(adminState.error || "Only admin users can approve or reject accounts.");
      return;
    }
    var updatePayload = {
      approval_status: status,
      approved_by: status === "approved" ? session.user.id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null
    };
    var result = await client
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", targetUserId);

    if (result.error) {
      setAuthStatus("Approval update failed: " + result.error.message);
      return;
    }
    await loadPendingApprovals();
    setAuthStatus("Account " + status + ".");
  }

  async function syncAuthUI(session) {
    await loadRuns();

    if (!session || !session.user) {
      submissionSection.classList.add("hidden");
      signOutBtn.classList.add("hidden");
      googleSignInBtn.classList.remove("hidden");
      if (adminSection) adminSection.classList.add("hidden");
      setAuthStatus("Not signed in. Public leaderboard is visible; sign in to submit runs.");
      setApprovalStatus("");
      return;
    }

    var email = (session.user.email || "").toLowerCase();
    if (!email) {
      submissionSection.classList.add("hidden");
      if (adminSection) adminSection.classList.add("hidden");
      setAuthStatus("Signed in account missing email.");
      setApprovalStatus("");
      return;
    }

    var adminState = await isCurrentUserAdmin();
    var isAdmin = adminState.isAdmin;
    if (adminState.error) {
      setAuthStatus("Signed in as " + email + ", but admin check failed: " + adminState.error);
    }
    var ensureResult = await ensureProfile(session, isAdmin);
    if (!ensureResult.ok) {
      submissionSection.classList.add("hidden");
      if (adminSection) adminSection.classList.add("hidden");
      setApprovalStatus("");
      setAuthStatus("Signed in as " + email + ", but profile sync failed: " + ensureResult.message);
      return;
    }
    var profile = await fetchMyProfile(session.user.id);
    var approvalStatus = profile && profile.approval_status ? profile.approval_status : "pending";

    if (isAdmin || approvalStatus === "approved") {
      submissionSection.classList.remove("hidden");
      setApprovalStatus("");
    } else if (approvalStatus === "rejected") {
      submissionSection.classList.add("hidden");
      setApprovalStatus("Your account request was rejected. Contact the leaderboard admin for access.");
    } else {
      submissionSection.classList.add("hidden");
      setApprovalStatus("Your account is pending admin approval. You can view the leaderboard, but cannot submit runs yet.");
    }

    if (adminSection) {
      if (isAdmin) {
        adminSection.classList.remove("hidden");
        await loadPendingApprovals();
      } else {
        adminSection.classList.add("hidden");
      }
    }

    signOutBtn.classList.remove("hidden");
    googleSignInBtn.classList.add("hidden");
    setAuthStatus("Signed in as " + email);
  }

  async function signInWithGoogle() {
    setAuthStatus("Redirecting to Google sign-in ...");
    var baseUrl = window.SITE_BASEURL || "";
    var redirectTo =
      window.location.origin +
      baseUrl +
      "/auth/callback/";
    var signInResult = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo }
    });

    if (signInResult.error) {
      setAuthStatus("Sign-in failed: " + signInResult.error.message);
      return;
    }
  }

  async function signOut() {
    await client.auth.signOut();
    submissionSection.classList.add("hidden");
    signOutBtn.classList.add("hidden");
    googleSignInBtn.classList.remove("hidden");
    setAuthStatus("Signed out.");
  }

  async function submitRun(evt) {
    evt.preventDefault();
    setSubmitStatus("Submitting run...");

    var session = await getSession();
    if (!session || !session.user || !(session.user.email || "").toLowerCase()) {
      setSubmitStatus("You must be signed in with Google to submit.");
      return;
    }

    var email = session.user.email.toLowerCase();
    var displayName = userDisplayName(session.user);
    var adminState = await isCurrentUserAdmin();
    var profile = await fetchMyProfile(session.user.id);
    var isApproved = profile && profile.approval_status === "approved";
    if (!adminState.isAdmin && !isApproved) {
      setSubmitStatus("Your account must be approved by an admin before submitting runs.");
      return;
    }

    var payload = {
      user_id: session.user.id,
      account_email: email,
      display_name: displayName,
      track: "modded-nanogpt",
      run_description: (document.getElementById("run-description").value || "").trim(),
      contributors: (document.getElementById("contributors").value || "").trim() || null,
      time_to_3_28_sec: recordTimeInput && recordTimeInput.value ? Number(recordTimeInput.value) : null,
      run_log_url: (document.getElementById("run-log-url").value || "").trim() || null
    };

    if (!payload.run_description || !payload.time_to_3_28_sec || !payload.run_log_url) {
      setSubmitStatus("Record time, description, and log URL are required. Contributors is optional.");
      return;
    }

    var insertResult = await client.from("runs").insert(payload);
    if (insertResult.error) {
      setSubmitStatus("Submission failed: " + insertResult.error.message);
      return;
    }

    runForm.reset();
    setParseStatus("");
    setSubmitStatus("Run submitted.");
    await loadRuns();
  }

  if (googleSignInBtn) googleSignInBtn.addEventListener("click", signInWithGoogle);
  if (signOutBtn) signOutBtn.addEventListener("click", signOut);
  if (parseLogBtn) parseLogBtn.addEventListener("click", parseLogAndFillRecordTime);
  if (contributorFilterInput) contributorFilterInput.addEventListener("input", applyContributorFilter);
  if (pendingApprovalsWrap) {
    pendingApprovalsWrap.addEventListener("click", function (evt) {
      var approveTarget = evt.target && evt.target.getAttribute("data-approve");
      var rejectTarget = evt.target && evt.target.getAttribute("data-reject");
      if (approveTarget) {
        updateApproval(approveTarget, "approved");
      }
      if (rejectTarget) {
        updateApproval(rejectTarget, "rejected");
      }
    });
  }
  if (runForm) runForm.addEventListener("submit", submitRun);

  client.auth.onAuthStateChange(function () {
    getSession().then(syncAuthUI);
  });

  getSession().then(syncAuthUI);
})();
