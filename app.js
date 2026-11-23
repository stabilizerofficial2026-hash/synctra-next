import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://pbhuxeuwyhmdemvtsshy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9Y5Cqm-g22XPJjyn_-4wsg_xqEiWFxN";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const authView = $("auth-view");
const dashboardView = $("dashboard-view");
const authMessage = $("auth-message");
const dashboardMessage = $("dashboard-message");
const feedMessage = $("feed-message");

let currentUser = null;
let currentProfile = null;
let currentSubscription = null;

// =========================================================================
// REUSABLE COMMUNITY THEME CONFIGURATIONS
// =========================================================================
const GROUP_THEMES = {
  open: {
    slug: "open-discussion",
    category: "EMERALD SANCTUARY · HARMONY",
    subtitle: "Nature · Leaves · Harmony · Open Perspectives",
    icon: "🌿",
    artwork: "assets/open-minds/open-discussion.webp",
    tone: 174.61
  },
  "open-discussion": {
    slug: "open-discussion",
    category: "EMERALD SANCTUARY · HARMONY",
    subtitle: "Nature · Leaves · Harmony · Open Perspectives",
    icon: "🌿",
    artwork: "assets/open-minds/open-discussion.webp",
    tone: 174.61
  },
  activists: {
    slug: "activists",
    category: "EARTH & EQUALITY · SOCIAL ACTION",
    subtitle: "Social Justice · Equality · Community · Environmental Stewardship",
    icon: "✊",
    artwork: "assets/open-minds/activists.webp",
    tone: 130.81
  },
  christianity: {
    slug: "christianity",
    category: "SACRED LIGHT · SCRIPTURE & PEACE",
    subtitle: "Faith · Cross · Scripture · Peaceful Sky & Golden Light",
    icon: "✝",
    artwork: "assets/open-minds/christianity.webp",
    tone: 220.0
  },
  hinduism: {
    slug: "hinduism",
    category: "DHARMA & DEVOTION · SACRED HERITAGE",
    subtitle: "Om · Traditional Temple Architecture · Spiritual Philosophy",
    icon: "ॐ",
    artwork: "assets/open-minds/hinduism.webp",
    tone: 233.08
  },
  satanism: {
    slug: "satanism",
    category: "OBSIDIAN & CRIMSON · INDIVIDUAL SOVEREIGNTY",
    subtitle: "Philosophy · Symbolism · Self-Determination & Atmospheric Inquiry",
    icon: "⛤",
    artwork: "assets/open-minds/satanism.webp",
    wallpaper: "assets/open-minds/satanism-wallpaper.webp",
    bannerArtwork: "assets/open-minds/satanism-banner.webp",
    emblem: "assets/open-minds/satanism-emblem.webp",
    tone: 155.56
  },
  lgbtq: {
    slug: "lgbtq",
    category: "PRISM SPECTRUM · INCLUSIVE COMMUNITY",
    subtitle: "Pride · Equality · Creative Identity · Rainbow Harmony",
    icon: "🌈",
    artwork: "assets/ai-gallery/immersive-color-world.webp",
    tone: 261.63
  },
  islam: {
    slug: "islam",
    category: "CRESCENT & HARMONY · FAITH & CULTURE",
    subtitle: "Beliefs · Culture · History & Contemplation",
    icon: "☪",
    artwork: "assets/open-minds/islam.webp",
    tone: 196.0
  },
  buddhism: {
    slug: "buddhism",
    category: "LOTUS STILLNESS · MINDFULNESS",
    subtitle: "Mindfulness · Compassion · Philosophy & Practice",
    icon: "☸",
    artwork: "assets/open-minds/buddhism.webp",
    tone: 164.81
  },
  taoism: {
    slug: "taoism",
    category: "FLOWING TAO · NATURAL BALANCE",
    subtitle: "Balance · Nature · Wu Wei & Harmony",
    icon: "☯",
    artwork: "assets/open-minds/taoism.webp",
    tone: 146.83
  },
  science: {
    slug: "science",
    category: "COSMIC INQUIRY · EVIDENCE & DISCOVERY",
    subtitle: "Evidence · Discovery · Curiosity & Rational Exploration",
    icon: "⚛",
    artwork: "assets/open-minds/science.webp",
    tone: 261.63
  },
  atheism: {
    slug: "atheism",
    category: "SECULAR REASON · ETHICS & HUMANISM",
    subtitle: "Reason · Secular Ethics · Critical Thought",
    icon: "◎",
    artwork: "assets/open-minds/atheism.webp",
    tone: 185.0
  },
  tech: {
    slug: "hacker-community",
    category: "CYBER SANCTUARY · ETHICAL TECH",
    subtitle: "Ethical Cybersecurity · Systems · Digital Craft",
    icon: "⌘",
    artwork: "assets/open-minds/hacker-community.webp",
    tone: 207.65
  }
};

function getThemeConfig(slug) {
  const normalized = String(slug || "open").toLowerCase().trim();
  return GROUP_THEMES[normalized] || {
    slug: normalized,
    category: "OPEN MINDS · COMMUNITY",
    subtitle: "Create • Share • Collaborate • Respect",
    icon: "◎",
    artwork: "assets/open-minds/open-discussion.webp",
    tone: 174.61
  };
}

function applyCommunityTheme(slug, room = null) {
  const panel = $("community-room-panel");
  if (!panel) return;
  const theme = getThemeConfig(slug);
  panel.dataset.roomSlug = theme.slug;
  panel.style.setProperty("--room-background", `url("${theme.artwork}")`);
  panel.style.setProperty("--room-wallpaper", `url("${theme.wallpaper || theme.artwork}")`);
  panel.style.setProperty("--room-banner-art", `url("${theme.bannerArtwork || theme.artwork}")`);
  panel.style.setProperty("--room-emblem", theme.emblem ? `url("${theme.emblem}")` : "none");
  if ($("community-room-category")) $("community-room-category").textContent = theme.category;
  if ($("community-banner-category")) $("community-banner-category").textContent = theme.category;
  if ($("community-banner-subtitle")) $("community-banner-subtitle").textContent = theme.subtitle;
  if ($("community-room-icon") && room) {
    const iconHost = $("community-room-icon");
    if (theme.emblem) {
      iconHost.replaceChildren();
      const emblem = document.createElement("img");
      emblem.src = theme.emblem;
      emblem.alt = `${room.room_name} emblem`;
      emblem.decoding = "async";
      iconHost.append(emblem);
    } else {
      iconHost.textContent = room.icon || theme.icon;
    }
  }
}

function message(el, text, error = false) {
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("error", Boolean(error));
}

function setBusy(form, busy) {
  const button = form.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = busy;
    button.dataset.original ||= button.textContent;
    button.textContent = busy ? "Please wait…" : button.dataset.original;
  }
}

function showTab(which) {
  const login = which === "login";
  $("login-form").classList.toggle("hidden", !login);
  $("signup-form").classList.toggle("hidden", login);
  $("tab-login").classList.toggle("active", login);
  $("tab-signup").classList.toggle("active", !login);
  message(authMessage, "");
}

$("tab-login").addEventListener("click", () => showTab("login"));
$("tab-signup").addEventListener("click", () => showTab("signup"));

$("welcome-express").addEventListener("click", () => {
  $("welcome-screen").classList.add("hidden");
  authView.classList.remove("hidden");
  showTab("login");
  $("login-email").focus();
});

$("welcome-evolve").addEventListener("click", () => {
  $("welcome-screen").classList.add("hidden");
  authView.classList.remove("hidden");
  showTab("signup");
  $("signup-username").focus();
});

document.querySelectorAll("[data-plan-cta]").forEach((button) => {
  button.addEventListener("click", () => $("welcome-evolve").click());
});

$("back-to-welcome").addEventListener("click", () => {
  authView.classList.add("hidden");
  $("welcome-screen").classList.remove("hidden");
  message(authMessage, "");
});

function calculateAge(dobText) {
  const dob = new Date(`${dobText}T00:00:00`);
  if (!dobText || Number.isNaN(dob.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthday) age--;
  return age;
}

$("signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  message(authMessage, "");
  const username = $("signup-username").value.trim();
  const displayName = $("signup-display").value.trim();
  const email = $("signup-email").value.trim();
  const password = $("signup-password").value;
  const dob = $("signup-dob").value;

  if (!/^[A-Za-z0-9_]{3,24}$/.test(username))
    return message(authMessage, "Username must be 3–24 letters, numbers or underscores.", true);
  if (calculateAge(dob) < 18)
    return message(authMessage, "SyncTrA is for adults aged 18 and older.", true);
  if (!$("age-check").checked || !$("rules-check").checked)
    return message(authMessage, "Please confirm the age requirement and community rules.", true);

  setBusy(form, true);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: displayName, date_of_birth: dob } }
  });
  setBusy(form, false);
  if (error) return message(authMessage, error.message, true);
  if (data.session) {
    message(authMessage, "Account created. Your member space is opening…");
    await loadMember(data.user);
  } else {
    message(authMessage, "Registration received. Check your email, then log in.");
    $("signup-form").reset();
    showTab("login");
  }
});

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  message(authMessage, "");
  setBusy(form, true);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: $("login-email").value.trim(),
    password: $("login-password").value
  });
  setBusy(form, false);
  if (error) return message(authMessage, error.message, true);
  await loadMember(data.user);
});

$("forgot-password").addEventListener("click", async () => {
  const email = $("login-email").value.trim();
  if (!email) return message(authMessage, "Enter your email address first.", true);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  message(
    authMessage,
    error ? error.message : "If the email exists, a password reset link will be sent.",
    Boolean(error)
  );
});

async function renderMembershipGate(status, subscription = null) {
  $("member-content").classList.add("hidden");
  $("membership-gate").classList.remove("hidden");
  const title = $("gate-title");
  const description = $("gate-description");
  if (status === "pending") {
    title.textContent = "Payment verification pending";
    description.textContent =
      "We have a membership record, but it is not active yet. SyncTrA will unlock your private space only after payment is verified by the payment provider.";
  } else if (["expired", "cancelled", "past_due", "suspended"].includes(status)) {
    title.textContent = "Your membership needs renewal";
    description.textContent =
      "Your subscription is not currently active. Renew through secure checkout when it becomes available to restore member access.";
  } else {
    title.textContent = "Welcome to SyncTrA — membership required";
    description.textContent =
      "Choose a membership tier to join the private creator community. Access is granted only after the payment provider verifies your payment.";
  }
  if (subscription?.current_period_end) {
    const expiry = new Date(subscription.current_period_end);
    if (!Number.isNaN(expiry.getTime()))
      description.textContent += ` Current period ends: ${expiry.toLocaleDateString()}.`;
  }
  const host = $("membership-plans");
  host.replaceChildren();
  const { data: plans, error } = await supabase
    .from("subscription_plans")
    .select(
      "id,name,monthly_price_minor,currency,monthly_credits,profile_music_seconds,group_member_limit,marketplace_selling"
    )
    .eq("active", true)
    .order("monthly_price_minor", { ascending: true });
  if (error) {
    message(
      $("membership-gate-message"),
      "Membership options could not be loaded. Please try again later.",
      true
    );
    return;
  }
  for (const plan of plans || []) {
    const card = node("article", "plan-card");
    card.append(node("p", "eyebrow", plan.id.replaceAll("_", " ").toUpperCase()));
    card.append(node("h3", "", plan.name));
    card.append(
      node(
        "strong",
        "plan-price",
        plan.monthly_price_minor > 0
          ? `${plan.currency} ${(plan.monthly_price_minor / 100).toFixed(2)} / month`
          : "Price to be announced"
      )
    );
    const storageByPlan = {
      creator: "512 MiB storage",
      creator_plus: "2 GiB storage",
      creator_pro: "10 GiB storage"
    };
    const details = [
      `${Number(plan.monthly_credits).toLocaleString()} monthly credits`,
      `Groups up to ${Number(plan.group_member_limit).toLocaleString()} members`,
      storageByPlan[plan.id] || "Storage allocation shown in account details",
      `${plan.profile_music_seconds}s profile soundtrack`
    ];
    if (plan.marketplace_selling) details.push("Marketplace selling access");
    const featureList = node("ul", "plan-feature-list");
    details.forEach((detail) => featureList.append(node("li", "", detail)));
    card.append(featureList);
    const action = node("button", "secondary", "Checkout coming soon");
    action.type = "button";
    action.disabled = true;
    action.setAttribute("aria-disabled", "true");
    card.append(action);
    host.append(card);
  }
  message(
    $("membership-gate-message"),
    "Payment processing is not connected yet. No plan selection can activate an account."
  );
}

function getTierDisplay(planId) {
  const map = {
    creator: { label: "Creator", badge: "✦ CREATOR", credits: "300" },
    creator_plus: { label: "Creator Plus", badge: "♛ CREATOR PLUS", credits: "1,000" },
    creator_pro: { label: "Creator Pro", badge: "❖ CREATOR PRO", credits: "2,500" }
  };
  return map[planId] || { label: "Member", badge: "✦ MEMBER", credits: "300" };
}

async function loadMember(user) {
  currentUser = user;
  message(dashboardMessage, "");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "user_id, username, display_name, bio, personality_type, hobbies, age_verified_at, account_status"
    )
    .eq("user_id", user.id)
    .single();

  if (error) {
    await supabase.auth.signOut();
    currentUser = null;
    authView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
    showTab("login");
    return message(authMessage, "Profile could not be loaded. " + error.message, true);
  }
  if (profile.account_status !== "active" || !profile.age_verified_at) {
    await supabase.auth.signOut();
    currentUser = null;
    return message(authMessage, "This account is not currently eligible for member access.", true);
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id,status,plan_id,current_period_start,current_period_end,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (subscriptionError) {
    await supabase.auth.signOut();
    currentUser = null;
    return message(
      authMessage,
      "Membership status could not be verified. Please try again.",
      true
    );
  }
  const subscription = subscriptions?.[0] || null;
  currentSubscription = subscription;
  const isPaidActive =
    subscription?.status === "active" &&
    subscription.current_period_end &&
    new Date(subscription.current_period_end).getTime() > Date.now();

  currentProfile = profile;
  const tierInfo = getTierDisplay(subscription?.plan_id);

  $("member-display").textContent = profile.display_name || "Creator";
  $("profile-name").textContent = profile.display_name || "Member";
  $("profile-username").textContent = "@" + profile.username;
  $("profile-bio").textContent =
    profile.bio?.trim() || "Add a little introduction to your creative world.";
  $("profile-personality").textContent = profile.personality_type || "Not set";
  $("profile-hobbies").textContent = profile.hobbies?.trim() || "Not set";
  $("profile-email").textContent = user.email || "";
  $("avatar-letter").textContent = (profile.display_name || "S").trim().charAt(0).toUpperCase();
  if ($("composer-avatar"))
    $("composer-avatar").textContent = (profile.display_name || "S").trim().charAt(0).toUpperCase();

  if ($("profile-rank-badge")) $("profile-rank-badge").textContent = tierInfo.badge;
  if ($("profile-cty-info"))
    $("profile-cty-info").textContent = `CTY ${tierInfo.label} · Verified`;
  if ($("profile-cty-balance")) $("profile-cty-balance").textContent = tierInfo.credits;
  if ($("profile-tier-label")) $("profile-tier-label").textContent = `${tierInfo.label} Tier`;

  $("edit-display").value = profile.display_name || "";
  $("edit-bio").value = profile.bio || "";
  $("edit-personality").value = profile.personality_type || "";
  $("edit-hobbies").value = profile.hobbies || "";
  $("profile-form").classList.add("hidden");
  $("profile-edit-open").classList.remove("hidden");
  $("welcome-screen").classList.add("hidden");
  authView.classList.add("hidden");
  dashboardView.classList.remove("hidden");

  document.querySelectorAll(".auth-only-link").forEach((el) => el.classList.remove("hidden"));

  if (!isPaidActive) {
    await renderMembershipGate(subscription?.status || "none", subscription);
    return;
  }
  $("membership-gate").classList.add("hidden");
  $("member-content").classList.remove("hidden");
  $("membership-status").textContent = `Active · ${subscription.plan_id.replaceAll("_", " ")}`;
  if ($("membership-pill")) {
    $("membership-pill").textContent = `CTY ${tierInfo.label} · ${tierInfo.credits} monthly credits`;
  }

  await loadFeed();
  await loadBlockedUsers();
  await loadMyReports();
  await loadGroups();
  await loadCommunityRooms();
  await loadNotifications();
  await loadMessages();
  await loadNetwork();
  await loadModeratorQueue();
}

function resetProfileEditor() {
  if (!currentProfile) return;
  $("edit-display").value = currentProfile.display_name || "";
  $("edit-bio").value = currentProfile.bio || "";
  $("edit-personality").value = currentProfile.personality_type || "";
  $("edit-hobbies").value = currentProfile.hobbies || "";
}

$("profile-edit-open").addEventListener("click", () => {
  resetProfileEditor();
  $("profile-form").classList.remove("hidden");
  $("profile-edit-open").classList.add("hidden");
  message(dashboardMessage, "");
  $("edit-display").focus();
});

$("profile-edit-cancel").addEventListener("click", () => {
  resetProfileEditor();
  $("profile-form").classList.add("hidden");
  $("profile-edit-open").classList.remove("hidden");
  message(dashboardMessage, "");
});

// Profile sub-drawers: Appearance, Account Settings, Sound Controls
function toggleProfileDrawer(drawerId, btnId) {
  const drawers = ["profile-appearance-drawer", "profile-account-drawer", "profile-sound-drawer"];
  const buttons = ["profile-appearance-toggle", "profile-settings", "profile-sound-toggle"];
  drawers.forEach((id, idx) => {
    const el = $(id);
    const btn = $(buttons[idx]);
    if (!el) return;
    if (id === drawerId) {
      const willOpen = el.classList.contains("hidden");
      el.classList.toggle("hidden", !willOpen);
      btn?.setAttribute("aria-expanded", String(willOpen));
    } else {
      el.classList.add("hidden");
      btn?.setAttribute("aria-expanded", "false");
    }
  });
}

$("profile-appearance-toggle")?.addEventListener("click", () =>
  toggleProfileDrawer("profile-appearance-drawer", "profile-appearance-toggle")
);
$("profile-settings")?.addEventListener("click", () =>
  toggleProfileDrawer("profile-account-drawer", "profile-settings")
);
$("profile-sound-toggle")?.addEventListener("click", () =>
  toggleProfileDrawer("profile-sound-drawer", "profile-sound-toggle")
);

document.querySelectorAll("[data-ui-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.uiTheme;
    document.body.dataset.accentTheme = theme;
    try {
      localStorage.setItem("synctra_ui_theme", theme);
    } catch {}
    document
      .querySelectorAll("[data-ui-theme]")
      .forEach((b) => b.classList.toggle("is-active", b === btn));
    message(dashboardMessage, `Interface accent updated to ${btn.textContent}.`);
  });
});

try {
  const savedTheme = localStorage.getItem("synctra_ui_theme");
  if (savedTheme) {
    document.body.dataset.accentTheme = savedTheme;
    document
      .querySelectorAll("[data-ui-theme]")
      .forEach((b) => b.classList.toggle("is-active", b.dataset.uiTheme === savedTheme));
  }
} catch {}

$("profile-reset-password")?.addEventListener("click", async () => {
  if (!currentUser?.email) return;
  const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
    redirectTo: window.location.origin
  });
  message(
    dashboardMessage,
    error
      ? error.message
      : `Password reset link sent to ${currentUser.email}.`,
    Boolean(error)
  );
});

$("profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !currentProfile) return;
  const display_name = $("edit-display").value.trim();
  const bio = $("edit-bio").value.trim();
  const personality_type = $("edit-personality").value;
  const hobbies = $("edit-hobbies").value.trim();
  const allowedPersonalities = ["", "Sanguine", "Choleric", "Melancholic", "Phlegmatic", "Mixed"];
  if (
    !display_name ||
    display_name.length > 60 ||
    bio.length > 300 ||
    hobbies.length > 180 ||
    !allowedPersonalities.includes(personality_type)
  )
    return message(dashboardMessage, "Please check your profile details and character limits.", true);
  const { data: savedProfile, error } = await supabase
    .from("profiles")
    .update({
      display_name,
      bio,
      personality_type: personality_type || null,
      hobbies: hobbies || null
    })
    .eq("user_id", currentUser.id)
    .select("user_id, display_name, bio, personality_type, hobbies")
    .single();
  if (error) return message(dashboardMessage, "Profile could not be saved: " + error.message, true);
  if (!savedProfile)
    return message(
      dashboardMessage,
      "No profile row was updated. Please sign out and sign in again.",
      true
    );
  currentProfile.display_name = savedProfile.display_name;
  currentProfile.bio = savedProfile.bio || "";
  currentProfile.personality_type = savedProfile.personality_type || null;
  currentProfile.hobbies = savedProfile.hobbies || null;
  $("profile-bio").textContent =
    savedProfile.bio?.trim() || "Add a little introduction to your creative world.";
  $("profile-personality").textContent = savedProfile.personality_type || "Not set";
  $("profile-hobbies").textContent = savedProfile.hobbies?.trim() || "Not set";
  $("member-display").textContent = display_name;
  $("profile-name").textContent = display_name;
  $("avatar-letter").textContent = display_name.trim().charAt(0).toUpperCase();
  if ($("composer-avatar"))
    $("composer-avatar").textContent = display_name.trim().charAt(0).toUpperCase();
  $("profile-form").classList.add("hidden");
  $("profile-edit-open").classList.remove("hidden");
  message(dashboardMessage, "Profile saved.");
});

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDayLabel(value) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

const expandedPostIds = new Set();

function initials(name) {
  return (name || "M").trim().charAt(0).toUpperCase() || "M";
}

function closePostMenus(except = null) {
  document.querySelectorAll(".post-menu:not(.hidden)").forEach((menu) => {
    if (menu !== except) {
      menu.classList.add("hidden");
      menu.parentElement?.querySelector(".post-more")?.setAttribute("aria-expanded", "false");
    }
  });
}
document.addEventListener("click", (event) => {
  if (!event.target.closest?.(".post-more-wrap")) closePostMenus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePostMenus();
});

async function loadFeed() {
  if (!currentUser) return;
  message(feedMessage, "Loading member posts…");
  $("feed-list").replaceChildren();

  const [{ data: posts, error }, { data: blockRows }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, author_id, body, created_at")
      .is("group_id", null)
      .eq("visibility", "members")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("blocked_users").select("blocked_user_id").eq("blocker_id", currentUser.id)
  ]);

  if (error) {
    message(feedMessage, "Feed could not be loaded: " + error.message, true);
    await loadBlockedUsers();
    return;
  }

  const blockedIds = new Set((blockRows || []).map((r) => r.blocked_user_id));
  const visiblePosts = (posts || []).filter((p) => !blockedIds.has(p.author_id));
  if (!visiblePosts.length) {
    message(
      feedMessage,
      posts?.length
        ? "Posts from members you have blocked are hidden."
        : "No posts yet. Be the first to share an update."
    );
    await loadBlockedUsers();
    return;
  }

  const ids = visiblePosts.map((p) => p.id);
  const authorIds = [...new Set(visiblePosts.map((p) => p.author_id))];
  const [{ data: reactions }, { data: comments }] = await Promise.all([
    supabase.from("reactions").select("post_id, user_id").in("post_id", ids),
    supabase
      .from("comments")
      .select("id, post_id, author_id, body, created_at")
      .in("post_id", ids)
      .eq("status", "published")
      .order("created_at", { ascending: true })
  ]);
  const visibleComments = (comments || []).filter((c) => !blockedIds.has(c.author_id));
  const profileIds = [...new Set([...authorIds, ...visibleComments.map((c) => c.author_id)])];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name")
    .in("user_id", profileIds);
  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
  const reactionRows = reactions || [];

  for (const post of visiblePosts) {
    $("feed-list").append(
      buildPostCard(post, {
        profileMap,
        reactions: reactionRows.filter((r) => r.post_id === post.id),
        comments: visibleComments.filter((c) => c.post_id === post.id)
      })
    );
  }
  message(
    feedMessage,
    `Showing ${visiblePosts.length} latest post${visiblePosts.length === 1 ? "" : "s"}.`
  );
  await loadBlockedUsers();
}

function buildPostCard(post, { profileMap, reactions, comments }) {
  const author = profileMap.get(post.author_id);
  const authorName = author?.display_name || "SyncTrA member";
  const handle = "@" + (author?.username || "member");
  const isOwn = post.author_id === currentUser.id;
  const ownReaction = reactions.some((r) => r.user_id === currentUser.id);

  const card = node("article", "panel post-card");
  card.dataset.postId = post.id;

  const top = node("header", "post-top");
  const avatar = node("div", "post-avatar", initials(authorName));
  avatar.setAttribute("role", "button");
  avatar.setAttribute("tabindex", "0");
  avatar.setAttribute("aria-label", "View member profile");
  avatar.addEventListener("click", () => openMemberProfile(post.author_id));
  avatar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openMemberProfile(post.author_id);
  });

  const identity = node("div", "post-identity");
  const nameRow = node("div", "post-name-row");
  const nameLink = node("button", "member-link post-author", authorName);
  nameLink.type = "button";
  nameLink.addEventListener("click", () => openMemberProfile(post.author_id));
  const badge = node("span", "member-tier-chip", isOwn ? getTierDisplay(currentSubscription?.plan_id).label : "Member");
  nameRow.append(nameLink, badge);

  const meta = node("span", "post-meta");
  const handleLink = node("button", "member-link member-handle", handle);
  handleLink.type = "button";
  handleLink.addEventListener("click", () => openMemberProfile(post.author_id));
  const time = node("time", "post-time", formatDate(post.created_at));
  time.dateTime = post.created_at;
  meta.append(handleLink, node("span", "post-meta-sep", "·"), time);
  identity.append(nameRow, meta);

  const moreWrap = node("div", "post-more-wrap");
  const more = node("button", "post-more", "⋯");
  more.type = "button";
  more.setAttribute("aria-label", "More options for this post");
  more.setAttribute("aria-haspopup", "menu");
  more.setAttribute("aria-expanded", "false");
  const menu = node("div", "post-menu hidden");
  menu.setAttribute("role", "menu");
  more.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = menu.classList.contains("hidden");
    closePostMenus(menu);
    menu.classList.toggle("hidden", !willOpen);
    more.setAttribute("aria-expanded", String(willOpen));
  });
  if (isOwn) {
    const del = node("button", "post-menu-item danger", "Delete post");
    del.type = "button";
    del.setAttribute("role", "menuitem");
    del.addEventListener("click", () => deleteOwnPost(post.id));
    menu.append(del);
  } else {
    const report = node("button", "post-menu-item", "Report post");
    report.type = "button";
    report.setAttribute("role", "menuitem");
    report.addEventListener("click", () => {
      closePostMenus();
      reportPost(post.id);
    });
    const block = node("button", "post-menu-item danger", `Block ${authorName}`);
    block.type = "button";
    block.setAttribute("role", "menuitem");
    block.addEventListener("click", () => {
      closePostMenus();
      blockMember(post.author_id, authorName);
    });
    menu.append(report, block);
  }
  moreWrap.append(more, menu);
  top.append(avatar, identity, moreWrap);

  const body = node("p", "post-body", post.body);

  const stats = node("div", "post-stats");
  const likeCount = node(
    "span",
    "post-like-count",
    reactions.length ? `♥ ${reactions.length}` : ""
  );
  const commentsStat = node(
    "button",
    "post-comments-stat",
    comments.length ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : ""
  );
  commentsStat.type = "button";
  stats.append(likeCount, commentsStat);

  const actions = node("div", "post-actions");
  const like = node(
    "button",
    ownReaction ? "reaction-button liked" : "reaction-button",
    ownReaction ? "♥ Liked" : "♡ Like"
  );
  like.type = "button";
  like.setAttribute("aria-pressed", String(ownReaction));
  like.addEventListener("click", () => toggleLike(post.id, ownReaction));
  const commentToggle = node("button", "reaction-button", "💬 Comment");
  commentToggle.type = "button";
  const share = node("button", "reaction-button", "↗ Share");
  share.type = "button";
  share.addEventListener("click", async () => {
    const username = window.prompt("Share this post. Enter the member username:");
    if (username === null) return;
    try {
      const recipient = await profileForUsername(username);
      if (!recipient)
        return message(feedMessage, "No active member found with that username.", true);
      if (recipient.user_id === currentUser.id)
        return message(feedMessage, "Choose another member to share this post with.", true);
      const { error } = await supabase
        .from("post_shares")
        .insert({ post_id: post.id, shared_by: currentUser.id, recipient_id: recipient.user_id });
      if (error)
        return message(
          feedMessage,
          error.code === "23505"
            ? "You've already shared this post with that member."
            : error.message,
          true
        );
      message(feedMessage, `Post shared with @${recipient.username}.`);
      await loadNotifications();
    } catch (err) {
      message(feedMessage, err.message, true);
    }
  });
  actions.append(like, commentToggle, share);

  const commentsBox = node("div", "comments-box");
  if (expandedPostIds.has(post.id)) commentsBox.classList.add("expanded");
  for (const c of comments) {
    const cp = profileMap.get(c.author_id);
    const row = node("div", "comment-row");
    row.append(node("div", "comment-avatar", initials(cp?.display_name)));
    const bubble = node("div", "comment-bubble");
    bubble.append(node("b", "", cp?.display_name || "Member"), node("p", "comment-text", c.body));
    row.append(bubble);
    commentsBox.append(row);
  }
  const commentForm = node("form", "comment-form");
  const input = node("input", "comment-input");
  input.type = "text";
  input.maxLength = 1000;
  input.required = true;
  input.placeholder = "Write a comment…";
  input.setAttribute("aria-label", "Write a comment");
  const send = node("button", "secondary comment-send", "Send");
  send.type = "submit";
  commentForm.append(input, send);
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return message(feedMessage, "Write a comment before sending.", true);
    send.disabled = true;
    const { error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, author_id: currentUser.id, body: text });
    send.disabled = false;
    if (error) return message(feedMessage, "Comment failed: " + error.message, true);
    expandedPostIds.add(post.id);
    await loadFeed();
  });
  commentsBox.append(commentForm);

  const toggleComments = () => {
    const open = commentsBox.classList.toggle("expanded");
    if (open) expandedPostIds.add(post.id);
    else expandedPostIds.delete(post.id);
    commentToggle.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  };
  commentToggle.addEventListener("click", toggleComments);
  commentsStat.addEventListener("click", toggleComments);

  card.append(top, body, stats, actions, commentsBox);
  return card;
}

async function deleteOwnPost(postId) {
  closePostMenus();
  if (!window.confirm("Delete this post? This cannot be undone.")) return;
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", currentUser.id);
  if (error) return message(feedMessage, "Post could not be deleted: " + error.message, true);
  expandedPostIds.delete(postId);
  message(feedMessage, "Post deleted.");
  await loadFeed();
}

async function reportPost(postId) {
  const reason = window.prompt(
    "Why are you reporting this post? Include a clear reason (at least 3 characters)."
  );
  if (reason === null) return;
  const clean = reason.trim();
  if (clean.length < 3 || clean.length > 1000) {
    return message(feedMessage, "Please enter a report reason between 3 and 1,000 characters.", true);
  }
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: currentUser.id,
    target_type: "post",
    target_id: postId,
    reason: clean
  });
  if (error) return message(feedMessage, "Report could not be submitted: " + error.message, true);
  message(
    feedMessage,
    "Report submitted privately. It will be reviewed under the community rules."
  );
}

async function blockMember(userId, displayName) {
  if (
    !window.confirm(
      `Block ${displayName}? Their posts will be hidden from your feed. You can unblock them later.`
    )
  )
    return;
  const { error } = await supabase.from("blocked_users").insert({
    blocker_id: currentUser.id,
    blocked_user_id: userId
  });
  if (error) return message(feedMessage, "Member could not be blocked: " + error.message, true);
  message(feedMessage, "Member blocked. Their posts are now hidden from your feed.");
  await loadFeed();
  await loadBlockedUsers();
}

async function loadBlockedUsers() {
  if (!currentUser || !$("blocked-list")) return;
  const host = $("blocked-list");
  host.replaceChildren();
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_user_id,created_at")
    .eq("blocker_id", currentUser.id)
    .order("created_at", { ascending: false });
  if (error) return message($("blocked-message"), "Blocked list unavailable: " + error.message, true);
  if (!data?.length) {
    message($("blocked-message"), "You haven't blocked any members.");
    return;
  }
  const ids = data.map((row) => row.blocked_user_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id,display_name,username")
    .in("user_id", ids);
  if (profileError)
    return message($("blocked-message"), "Member details unavailable: " + profileError.message, true);
  const map = new Map((profiles || []).map((p) => [p.user_id, p]));
  for (const row of data) {
    const profile = map.get(row.blocked_user_id);
    const item = node("div", "blocked-row");
    const label = node(
      "span",
      "",
      `${profile?.display_name || "SyncTrA member"} (@${profile?.username || "member"})`
    );
    const unblock = node("button", "secondary unblock-button", "Unblock");
    unblock.type = "button";
    unblock.addEventListener("click", async () => {
      const { error: removeError } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", currentUser.id)
        .eq("blocked_user_id", row.blocked_user_id);
      if (removeError)
        return message($("blocked-message"), "Could not unblock member: " + removeError.message, true);
      await loadFeed();
      await loadBlockedUsers();
    });
    item.append(label, unblock);
    host.append(item);
  }
  message($("blocked-message"), `${data.length} blocked member${data.length === 1 ? "" : "s"}.`);
}

async function toggleLike(postId, alreadyLiked) {
  if (!currentUser) return;
  let result;
  if (alreadyLiked) {
    result = await supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", currentUser.id);
  } else {
    result = await supabase
      .from("reactions")
      .insert({ post_id: postId, user_id: currentUser.id, reaction_type: "like" });
  }
  if (result.error && result.error.code !== "23505")
    return message(feedMessage, "Reaction failed: " + result.error.message, true);
  await loadFeed();
}

$("post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) return;
  const form = event.currentTarget;
  const body = $("post-body").value.trim();
  if (!body || body.length > 3000)
    return message(feedMessage, "Write a post between 1 and 3,000 characters.", true);
  setBusy(form, true);
  const { error } = await supabase.from("posts").insert({
    author_id: currentUser.id,
    body,
    visibility: "members",
    status: "published"
  });
  setBusy(form, false);
  if (error) return message(feedMessage, "Post could not be published: " + error.message, true);
  form.reset();
  await loadFeed();
});

$("refresh-feed").addEventListener("click", loadFeed);
$("composer-pill")?.addEventListener("click", () => {
  const composer = document.querySelector(".composer");
  composer?.classList.add("is-open");
  const box = $("post-body");
  box.focus();
  box.scrollIntoView({ behavior: "smooth", block: "center" });
});

// =========================================================================
// PRIVATE GROUPS
// =========================================================================
let activeGroupId = null;
let groupMessageSending = false;
let activeGroupName = null;

async function loadGroups() {
  if (!currentUser) return;
  message($("groups-message"), "Loading your private groups…");
  $("groups-list").replaceChildren();
  const { data: plans } = await supabase
    .from("subscriptions")
    .select("plan_id,status,subscription_plans(group_member_limit,name)")
    .eq("user_id", currentUser.id)
    .eq("status", "active")
    .limit(1);
  const activePlan = plans?.[0];
  const limit = activePlan?.subscription_plans?.group_member_limit;
  const planName =
    activePlan?.subscription_plans?.name ||
    String(activePlan?.plan_id || "active").replaceAll("_", " ");
  $("group-plan-note").textContent = activePlan
    ? `Your active ${planName} plan allows you to create groups with up to ${Number(
        limit || 0
      ).toLocaleString()} members.`
    : "Creating a group requires an active subscription. Your current account has no active paid plan.";
  $("create-group-button").disabled = !activePlan;
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id,owner_id,group_name,description,member_limit,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return message($("groups-message"), "Groups could not load: " + error.message, true);
  if (!groups?.length)
    return message(
      $("groups-message"),
      "You have no private groups yet. Create one with an active plan or join an Open Minds community above."
    );
  const ids = groups.map((g) => g.id);
  const [{ data: members }, { data: profiles }] = await Promise.all([
    supabase
      .from("group_members")
      .select("group_id,user_id,member_role,membership_status")
      .in("group_id", ids),
    supabase.from("profiles").select("user_id,display_name,username")
  ]);
  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
  for (const g of groups) {
    const groupMembers = (members || []).filter((m) => m.group_id === g.id);
    const active = groupMembers.filter((m) => m.membership_status === "active");
    const card = document.createElement("article");
    card.className = "panel group-card";
    const h = document.createElement("h3");
    h.textContent = g.group_name;
    const desc = document.createElement("p");
    desc.className = "muted";
    desc.textContent = g.description || "A private SyncTrA group.";
    const meta = document.createElement("small");
    meta.textContent = `${active.length} active members · capacity ${Number(
      g.member_limit
    ).toLocaleString()} · ${
      g.owner_id === currentUser.id ? "You own this group" : "Member"
    } · ID ${g.id.slice(0, 8)}`;
    const actions = document.createElement("div");
    actions.className = "group-card-actions";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "primary";
    open.textContent = "Open group";
    open.addEventListener("click", () => openGroup(g));
    actions.append(open);
    if (g.owner_id === currentUser.id) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "secondary";
      copy.textContent = "Copy invitation ID";
      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(g.id);
          message(
            $("groups-message"),
            "Invitation ID copied. Share it privately with the intended member."
          );
        } catch {
          message($("groups-message"), "Copy unavailable. Group ID: " + g.id);
        }
      });
      actions.append(copy);
      const remove = node("button", "danger-button", "Delete group");
      remove.type = "button";
      remove.addEventListener("click", async () => {
        const confirmText = `Delete “${g.group_name}”? This permanently removes the group, its membership records and its group messages. This cannot be undone.`;
        if (!window.confirm(confirmText)) return;
        remove.disabled = true;
        const { error: deleteError } = await supabase
          .from("groups")
          .delete()
          .eq("id", g.id)
          .eq("owner_id", currentUser.id);
        remove.disabled = false;
        if (deleteError)
          return message(
            $("groups-message"),
            "Group could not be deleted: " + deleteError.message,
            true
          );
        if (activeGroupId === g.id) {
          $("group-room").classList.add("hidden");
          activeGroupId = null;
          activeGroupName = null;
        }
        message($("groups-message"), "Group deleted.");
        await loadGroups();
      });
      actions.append(remove);
      const pending = groupMembers.filter((m) => m.membership_status === "pending");
      for (const req of pending) {
        const row = document.createElement("div");
        row.className = "pending-row";
        const who = profileMap.get(req.user_id);
        const label = document.createElement("span");
        label.textContent = `Join request: ${who?.display_name || "Member"} (@${
          who?.username || "unknown"
        })`;
        const yes = document.createElement("button");
        yes.type = "button";
        yes.className = "secondary";
        yes.textContent = "Approve";
        yes.addEventListener("click", () => reviewGroupRequest(g.id, req.user_id, true));
        const no = document.createElement("button");
        no.type = "button";
        no.className = "secondary";
        no.textContent = "Decline";
        no.addEventListener("click", () => reviewGroupRequest(g.id, req.user_id, false));
        row.append(label, yes, no);
        card.append(row);
      }
    }
    card.append(h, desc, meta, actions);
    $("groups-list").append(card);
  }
  message(
    $("groups-message"),
    `Showing ${groups.length} group${groups.length === 1 ? "" : "s"} you can access.`
  );
}

async function reviewGroupRequest(groupId, userId, approve) {
  const { error } = await supabase.rpc("synctra_review_group_member", {
    p_group_id: groupId,
    p_user_id: userId,
    p_approve: approve
  });
  if (error) return message($("groups-message"), error.message, true);
  message($("groups-message"), approve ? "Member approved." : "Request declined.");
  await loadGroups();
}

async function openGroup(group) {
  activeGroupId = group.id;
  activeGroupName = group.group_name;
  $("group-room-title").textContent = group.group_name;
  $("group-banner-title").textContent = group.group_name;
  $("group-banner-desc").textContent =
    group.description || "Create • Share • Collaborate • Support";
  $("group-side-name").textContent = group.group_name;
  $("group-side-initial").textContent = (group.group_name || "G").trim().charAt(0).toUpperCase();
  $("group-side-desc").textContent = group.description || "";
  $("group-side-members").textContent = "Members loading…";
  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", group.id)
    .eq("membership_status", "active");
  $("group-side-members").textContent = "Members (" + (memberRows?.length || 0) + ")";
  $("group-room").classList.remove("hidden");
  await loadGroupMessages();
  $("group-room").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadGroupMessages() {
  if (!activeGroupId) return;
  $("group-chat-list").replaceChildren();
  const { data: rows, error } = await supabase
    .from("group_messages")
    .select("id,sender_id,body,created_at")
    .eq("group_id", activeGroupId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error)
    return message($("groups-message"), "Messages unavailable: " + error.message, true);
  const ids = [...new Set((rows || []).map((r) => r.sender_id))];
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("user_id,display_name").in("user_id", ids)
    : { data: [] };
  const map = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));
  if (!rows?.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No messages yet. Start the conversation.";
    $("group-chat-list").append(empty);
  }
  let lastDay = null;
  for (const row of rows || []) {
    const day = formatDayLabel(row.created_at);
    if (day !== lastDay) {
      lastDay = day;
      $("group-chat-list").append(node("div", "chat-day-separator", day));
    }
    const isOwn = row.sender_id === currentUser.id;
    const item = document.createElement("div");
    item.className =
      "group-message " + (isOwn ? "chat-bubble-own" : "chat-bubble-incoming");
    const name = map.get(row.sender_id) || "Member";
    const avatarWrap = node("div", "avatar-status-wrap");
    const avatar = document.createElement("div");
    avatar.className = "group-message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = name.trim().charAt(0).toUpperCase();
    const onlineDot = node("span", "avatar-online-dot");
    avatarWrap.append(avatar, onlineDot);

    const bubble = document.createElement("div");
    bubble.className = "group-message-bubble";
    const head = document.createElement("div");
    head.className = "group-message-head";
    const author = document.createElement("b");
    author.textContent = name;
    const badge = node(
      "span",
      "member-tier-chip",
      isOwn ? getTierDisplay(currentSubscription?.plan_id).label : "Member"
    );
    const time = document.createElement("small");
    time.textContent = new Date(row.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    head.append(author, badge, time);
    const body = document.createElement("p");
    body.textContent = row.body;
    bubble.append(head, body);
    item.append(avatarWrap, bubble);
    $("group-chat-list").append(item);
  }
  $("group-chat-list").scrollTop = $("group-chat-list").scrollHeight;
}

$("group-create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const name = $("new-group-name").value.trim(),
    description = $("new-group-description").value.trim();
  const btn = $("create-group-button");
  btn.disabled = true;
  const { data, error } = await supabase.rpc("synctra_create_group", {
    p_group_name: name,
    p_description: description
  });
  btn.disabled = false;
  if (error) return message($("groups-message"), error.message, true);
  form.reset();
  message($("groups-message"), "Private group created. Invitation ID: " + data);
  await loadGroups();
});

$("group-join-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const id = $("group-invite-id").value.trim();
  const { data, error } = await supabase.rpc("synctra_request_group_membership", {
    p_group_id: id
  });
  if (error) return message($("groups-message"), error.message, true);
  message(
    $("groups-message"),
    data === "already_member"
      ? "You are already a member."
      : "Join request sent. The group owner must approve it."
  );
  form.reset();
});

$("refresh-groups").addEventListener("click", loadGroups);
$("close-group-room").addEventListener("click", () => {
  $("group-room").classList.add("hidden");
  activeGroupId = null;
});

$("group-emoji-toggle")?.addEventListener("click", () => {
  const input = $("group-message-body");
  if (!input) return;
  input.value = `${input.value} ✨`.trimStart();
  input.focus();
});

$("group-message-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeGroupId || !currentUser || groupMessageSending) return;
  const body = $("group-message-body").value.trim();
  if (!body) return;
  const groupId = activeGroupId;
  const button = e.currentTarget.querySelector('button[type="submit"]');
  groupMessageSending = true;
  if (button) button.disabled = true;
  const { error } = await supabase
    .from("group_messages")
    .insert({ group_id: groupId, sender_id: currentUser.id, body });
  groupMessageSending = false;
  if (button) button.disabled = false;
  if (error) return message($("groups-message"), "Message not sent: " + error.message, true);
  $("group-message-body").value = "";
  await loadGroupMessages();
});

// =========================================================================
// OPEN MINDS COMMUNITY ROOMS & DYNAMIC THEME SYSTEM
// =========================================================================
let activeCommunityRoom = null;
let communityRealtimeChannel = null;
let communityMessageLoadToken = 0;
let communityMessageSending = false;
let communityAudioContext = null;
let communityAudioNodes = [];
let communityAudioOn = false;
let communityAudioVolume = 0.12;
let allCommunityRoomsCache = [];

async function loadCommunityRooms() {
  const host = $("community-rooms");
  if (!host || !currentUser) return;
  host.replaceChildren();
  const { data: rooms, error } = await supabase
    .from("community_rooms")
    .select("id,slug,room_name,description,icon,soundscape,is_default")
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("room_name");
  if (error) {
    host.textContent = "Open Minds rooms could not load: " + error.message;
    return;
  }
  allCommunityRoomsCache = rooms || [];

  const { data: mine, error: memberError } = await supabase
    .from("community_room_members")
    .select("room_id")
    .eq("user_id", currentUser.id);
  if (memberError) {
    host.textContent = "Your room memberships could not load.";
    return;
  }
  let joined = new Set((mine || []).map((x) => x.room_id));
  const defaultRoom = (rooms || []).find((r) => r.is_default);
  if (defaultRoom && !joined.has(defaultRoom.id)) {
    const { error: joinError } = await supabase.rpc("join_community_room", {
      p_room_id: defaultRoom.id
    });
    if (!joinError) joined.add(defaultRoom.id);
  }
  const refreshed = await supabase
    .from("community_room_members")
    .select("room_id")
    .eq("user_id", currentUser.id);
  joined = new Set((refreshed.data || []).map((x) => x.room_id));

  const roomIntro = {
    open: "Emerald sanctuary · Nature, harmony and open perspectives",
    activists: "Social justice, equality, community and environmental action",
    christianity: "Faith, scripture, peaceful sky and golden light",
    hinduism: "Om, sacred architecture, scriptures and spiritual philosophy",
    satanism: "Individual sovereignty, symbolism and philosophical inquiry",
    lgbtq: "Inclusive rainbow sanctuary · Pride, equality and creative identity",
    islam: "Beliefs, culture, history and perspectives",
    buddhism: "Mindfulness, philosophy and practice",
    taoism: "Balance, nature and the Tao",
    science: "Evidence, discovery and questions",
    atheism: "Reason, ethics and secular philosophy",
    tech: "Ethical cybersecurity and technology"
  };

  for (const room of rooms || []) {
    const theme = getThemeConfig(room.slug);
    const card = document.createElement("article");
    card.className = `community-room-card room-${theme.slug}`;
    card.style.setProperty("--room-artwork", `url("${theme.artwork}")`);
    card.dataset.roomSlug = theme.slug;

    const top = document.createElement("div");
    top.className = "community-room-card-top";
    const icon = document.createElement("span");
    icon.className = "community-room-icon";
    icon.textContent = room.icon || theme.icon;
    const title = document.createElement("h3");
    title.textContent = room.room_name;
    top.append(icon, title);

    const desc = document.createElement("p");
    desc.textContent = roomIntro[room.slug] || room.description;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "room-enter-button";
    action.textContent = "Enter room";
    action.addEventListener("click", async () => {
      if (!joined.has(room.id)) {
        action.disabled = true;
        const { error: joinErr } = await supabase.rpc("join_community_room", {
          p_room_id: room.id
        });
        action.disabled = false;
        if (joinErr) return message($("groups-message"), joinErr.message, true);
      }
      message($("groups-message"), "");
      await openCommunityRoom(room);
    });
    card.append(top, desc, action);
    host.append(card);
  }
}

async function openCommunityRoom(room) {
  activeCommunityRoom = room;
  applyCommunityTheme(room.slug, room);
  document.body.classList.add("community-room-open");

  $("community-room-title").textContent = room.room_name;
  if ($("community-side-title")) $("community-side-title").textContent = room.room_name;
  $("community-room-description").textContent = room.description;
  if ($("community-info-text")) {
    $("community-info-text").textContent = `${room.description} · Respect every member's dignity. Slow mode allows 1 message every 15 seconds.`;
  }
  $("community-info-drawer")?.classList.add("hidden");
  $("community-search-bar")?.classList.add("hidden");
  if ($("community-search-input")) $("community-search-input").value = "";

  // Sync theme switcher dropdown
  const switcher = $("community-theme-switcher");
  if (switcher) {
    const themeSlug = getThemeConfig(room.slug).slug;
    switcher.value = [...switcher.options].some((o) => o.value === themeSlug) ? themeSlug : "";
  }

  // Load room member count
  const { count } = await supabase
    .from("community_room_members")
    .select("user_id", { count: "exact", head: true })
    .eq("room_id", room.id);
  if ($("community-member-count")) {
    $("community-member-count").textContent =
      typeof count === "number" ? `Members (${count})` : "Members";
  }

  $("community-room-panel").classList.remove("hidden");
  await loadCommunityMessages();

  if (communityRealtimeChannel) {
    await supabase.removeChannel(communityRealtimeChannel);
    communityRealtimeChannel = null;
  }
  communityRealtimeChannel = supabase
    .channel("open-minds-" + room.id)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "community_messages",
        filter: "room_id=eq." + room.id
      },
      () => loadCommunityMessages()
    )
    .subscribe();

  if (communityAudioOn) startCommunityAmbience(room.soundscape || room.slug);
  $("community-message-body").focus({ preventScroll: true });
}

// Dynamic Theme Switcher inside the Messenger Sidebar
$("community-theme-switcher")?.addEventListener("change", async (e) => {
  const selectedSlug = e.target.value;
  if (!selectedSlug) return;
  const matchingRoom = allCommunityRoomsCache.find(
    (r) => getThemeConfig(r.slug).slug === selectedSlug || r.slug === selectedSlug
  );
  if (matchingRoom && matchingRoom.id !== activeCommunityRoom?.id) {
    const { error: joinErr } = await supabase.rpc("join_community_room", {
      p_room_id: matchingRoom.id
    });
    if (!joinErr) {
      await openCommunityRoom(matchingRoom);
      return;
    }
  }
  applyCommunityTheme(selectedSlug, activeCommunityRoom);
  message(
    $("community-chat-feedback"),
    `Theme updated to ${selectedSlug.replaceAll("-", " ").toUpperCase()}.`
  );
});

// Messenger Header & Sidebar Controls
$("community-room-add")?.addEventListener("click", async () => {
  const shareUrl = window.location.href;
  try {
    await navigator.clipboard.writeText(shareUrl);
    message(
      $("community-chat-feedback"),
      "SyncTrA invite link copied to clipboard. Share it with verified members."
    );
  } catch {
    message($("community-chat-feedback"), "Share SyncTrA with verified members: " + shareUrl);
  }
});

$("community-room-search-btn")?.addEventListener("click", () => {
  const bar = $("community-search-bar");
  if (!bar) return;
  const hidden = bar.classList.toggle("hidden");
  if (!hidden) $("community-search-input")?.focus();
  else {
    if ($("community-search-input")) $("community-search-input").value = "";
    filterCommunityMessages("");
  }
});

$("community-search-input")?.addEventListener("input", (e) => {
  filterCommunityMessages(e.target.value);
});

$("community-search-clear")?.addEventListener("click", () => {
  if ($("community-search-input")) $("community-search-input").value = "";
  filterCommunityMessages("");
  $("community-search-bar")?.classList.add("hidden");
});

function filterCommunityMessages(query) {
  const q = query.trim().toLowerCase();
  document.querySelectorAll("#community-chat-list .community-message").forEach((msg) => {
    const text = msg.textContent.toLowerCase();
    msg.classList.toggle("hidden", Boolean(q) && !text.includes(q));
  });
}

$("community-room-more-btn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  const menu = $("community-room-more-menu");
  const btn = $("community-room-more-btn");
  if (!menu) return;
  const open = menu.classList.toggle("hidden") === false;
  btn?.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (e) => {
  if (!e.target.closest?.(".room-more-wrap")) {
    $("community-room-more-menu")?.classList.add("hidden");
    $("community-room-more-btn")?.setAttribute("aria-expanded", "false");
  }
});

$("menu-toggle-sound")?.addEventListener("click", () => {
  $("community-room-more-menu")?.classList.add("hidden");
  $("community-audio-toggle")?.click();
});
$("menu-report-room")?.addEventListener("click", () => {
  $("community-room-more-menu")?.classList.add("hidden");
  $("community-room-report")?.click();
});
$("menu-leave-room")?.addEventListener("click", () => {
  $("community-room-more-menu")?.classList.add("hidden");
  $("community-room-leave")?.click();
});

document.querySelectorAll("[data-room-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("[data-room-tab]")
      .forEach((b) => b.classList.toggle("is-active", b === btn));
    const tab = btn.dataset.roomTab;
    const infoDrawer = $("community-info-drawer");
    if (tab === "info") {
      infoDrawer?.classList.remove("hidden");
    } else {
      infoDrawer?.classList.add("hidden");
    }
    if (tab === "members") {
      message(
        $("community-chat-feedback"),
        `${$("community-member-count")?.textContent || "Members"} active in ${
          activeCommunityRoom?.room_name || "this room"
        }.`
      );
    }
  });
});

$("room-side-notifications")?.addEventListener("click", async () => {
  await closeCommunityOverlay();
  $("notifications-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("community-emoji-toggle")?.addEventListener("click", () => {
  $("community-emoji-tray")?.classList.toggle("hidden");
});

document.querySelectorAll("#community-emoji-tray .emoji-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = $("community-message-body");
    if (!input) return;
    input.value += btn.textContent;
    input.focus();
  });
});

// Report a room once per account
$("community-room-report")?.addEventListener("click", async () => {
  if (!activeCommunityRoom || !currentUser) return;
  const reason = window.prompt(
    "Why should this group be reviewed? Please describe the concern (at least 3 characters)."
  );
  if (reason === null) return;
  const cleanReason = reason.trim().slice(0, 500);
  if (cleanReason.length < 3) {
    return message(
      $("community-chat-feedback"),
      "Please enter at least 3 characters so the report can be reviewed.",
      true
    );
  }
  const button = $("community-room-report");
  button.disabled = true;
  const { data, error } = await supabase.rpc("synctra_submit_room_report", {
    p_room_id: activeCommunityRoom.id,
    p_reason: cleanReason
  });
  button.disabled = false;
  if (error) {
    const duplicate = /already reported|duplicate|unique/i.test(error.message || "");
    message(
      $("community-chat-feedback"),
      duplicate
        ? "You have already reported this group. Your earlier report remains on record."
        : "The group report could not be submitted: " + error.message,
      true
    );
    return;
  }
  if (data?.suspended) {
    $("community-message-body").disabled = true;
    $("community-message-form")
      .querySelector('button[type="submit"]')
      ?.setAttribute("disabled", "disabled");
    message(
      $("community-chat-feedback"),
      "This room has reached 10 unique reports and is now suspended for 60 days. Messaging is paused while the room may be appealed."
    );
  } else {
    message(
      $("community-chat-feedback"),
      `Group report submitted. ${Number(
        data?.report_count || 0
      )} unique report(s) recorded; 10 trigger a 60-day room suspension.`
    );
  }
});

async function loadCommunityMessages() {
  if (!activeCommunityRoom) return;
  const roomId = activeCommunityRoom.id;
  const loadToken = ++communityMessageLoadToken;
  const host = $("community-chat-list");
  const { data: rows, error } = await supabase
    .from("community_messages")
    .select("id,sender_id,body,created_at")
    .eq("room_id", roomId)
    .eq("moderation_status", "published")
    .order("created_at", { ascending: true })
    .limit(100);
  if (loadToken !== communityMessageLoadToken || activeCommunityRoom?.id !== roomId) return;
  if (error) {
    message($("community-chat-feedback"), "Messages unavailable: " + error.message, true);
    return;
  }
  const ids = [...new Set((rows || []).map((r) => r.sender_id))];
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("user_id,display_name").in("user_id", ids)
    : { data: [] };
  if (loadToken !== communityMessageLoadToken || activeCommunityRoom?.id !== roomId) return;
  const names = new Map((profiles || []).map((x) => [x.user_id, x.display_name]));
  host.replaceChildren();
  if (!rows?.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No messages yet. Start with a thoughtful question or idea.";
    host.append(empty);
  }
  const renderedIds = new Set();
  let lastDay = null;
  for (const row of rows || []) {
    if (renderedIds.has(row.id)) continue;
    renderedIds.add(row.id);

    const day = formatDayLabel(row.created_at);
    if (day !== lastDay) {
      lastDay = day;
      host.append(node("div", "chat-day-separator", day));
    }

    const isOwn = row.sender_id === currentUser.id;
    const item = document.createElement("article");
    item.className =
      "community-message " + (isOwn ? "chat-bubble-own" : "chat-bubble-incoming");

    const avatarWrap = node("div", "avatar-status-wrap");
    const avatar = document.createElement("div");
    avatar.className = "community-message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = (names.get(row.sender_id) || "S").trim().charAt(0).toUpperCase();
    const onlineDot = node("span", "avatar-online-dot");
    avatarWrap.append(avatar, onlineDot);

    const bubble = document.createElement("div");
    bubble.className = "community-message-bubble";
    const head = document.createElement("div");
    head.className = "community-message-head";
    const author = document.createElement("b");
    author.textContent = names.get(row.sender_id) || "SyncTrA member";
    const badge = node(
      "span",
      "member-tier-chip",
      isOwn ? getTierDisplay(currentSubscription?.plan_id).label : "Member"
    );
    const time = document.createElement("small");
    time.textContent = new Date(row.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    head.append(author, badge, time);

    const body = document.createElement("p");
    body.textContent = row.body;
    bubble.append(head, body);
    item.append(avatarWrap, bubble);

    if (!isOwn) {
      const report = document.createElement("button");
      report.type = "button";
      report.className = "text-button community-report";
      report.textContent = "Report message";
      report.addEventListener("click", async () => {
        const reason = window.prompt(
          "Why are you reporting this message? (Spam, harassment, hate speech, threat, or other)"
        );
        if (!reason?.trim()) return;
        const { error: reportError } = await supabase.from("content_reports").insert({
          reporter_id: currentUser.id,
          target_type: "community_message",
          target_id: row.id,
          reason: reason.trim().slice(0, 500)
        });
        message(
          $("community-chat-feedback"),
          reportError
            ? "Report could not be submitted: " + reportError.message
            : "Thank you. Your report has been submitted for review.",
          Boolean(reportError)
        );
      });
      bubble.append(report);
    }
    host.append(item);
  }
  host.scrollTop = host.scrollHeight;
}

function stopCommunityAmbience() {
  for (const n of communityAudioNodes) {
    try {
      n.stop?.();
      n.disconnect?.();
    } catch {}
  }
  communityAudioNodes = [];
  if (communityAudioContext) {
    communityAudioContext.close().catch(() => {});
    communityAudioContext = null;
  }
}

function startCommunityAmbience(soundscape = "ambient") {
  stopCommunityAmbience();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    message($("community-chat-feedback"), "This browser does not support ambient audio.", true);
    return;
  }
  communityAudioContext = new AudioContextClass();
  const ctx = communityAudioContext;
  const base = getThemeConfig(soundscape).tone || 174.61;
  const master = ctx.createGain();
  master.gain.value = communityAudioVolume;
  master.connect(ctx.destination);
  communityAudioNodes.push(master);
  [1, 1.5, 2].forEach((ratio, index) => {
    const osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = base * ratio;
    gain.gain.value = index === 0 ? 0.34 : index === 1 ? 0.13 : 0.055;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    communityAudioNodes.push(osc, gain);
  });
  ctx.resume().catch(() => {});
  const label = "Soft generated ambient tones · " + (activeCommunityRoom?.room_name || "Open Minds");
  if ($("community-audio-status")) $("community-audio-status").textContent = label;
  if ($("profile-sound-status")) $("profile-sound-status").textContent = label;
}

function toggleAmbientSound() {
  communityAudioOn = !communityAudioOn;
  if ($("community-audio-toggle")) {
    $("community-audio-toggle").textContent = communityAudioOn ? "♫ Sound on" : "♫ Sound off";
    $("community-audio-toggle").setAttribute("aria-pressed", String(communityAudioOn));
  }
  if (communityAudioOn) {
    startCommunityAmbience(activeCommunityRoom?.soundscape || activeCommunityRoom?.slug || "open");
    if ($("community-audio-status"))
      $("community-audio-status").textContent = "Ambient sound is playing";
    if ($("profile-sound-status"))
      $("profile-sound-status").textContent = "Ambient sound is playing";
  } else {
    stopCommunityAmbience();
    if ($("community-audio-status"))
      $("community-audio-status").textContent = "Ambient sound is off";
    if ($("profile-sound-status"))
      $("profile-sound-status").textContent = "Ambient sound is off";
  }
}

$("community-audio-toggle")?.addEventListener("click", toggleAmbientSound);
$("profile-audio-btn")?.addEventListener("click", toggleAmbientSound);

function setAmbientVolume(val) {
  communityAudioVolume = Number(val) / 100;
  if ($("community-audio-volume")) $("community-audio-volume").value = String(val);
  if ($("profile-audio-volume")) $("profile-audio-volume").value = String(val);
  if (communityAudioOn && communityAudioNodes[0]) {
    communityAudioNodes[0].gain.value = communityAudioVolume;
  }
}

$("community-audio-volume")?.addEventListener("input", (e) => setAmbientVolume(e.target.value));
$("profile-audio-volume")?.addEventListener("input", (e) => setAmbientVolume(e.target.value));

async function closeCommunityOverlay() {
  $("community-room-panel").classList.add("hidden");
  $("community-emoji-tray")?.classList.add("hidden");
  activeCommunityRoom = null;
  document.body.classList.remove("community-room-open");
  if (communityRealtimeChannel) {
    await supabase.removeChannel(communityRealtimeChannel);
    communityRealtimeChannel = null;
  }
  if (communityAudioOn) {
    stopCommunityAmbience();
    if ($("community-audio-status"))
      $("community-audio-status").textContent = "Sound paused outside the room";
  }
}

$("community-room-leave").addEventListener("click", async () => {
  if (!activeCommunityRoom) return;
  const room = activeCommunityRoom;
  const { error } = await supabase.rpc("leave_community_room", { p_room_id: room.id });
  if (error) {
    message($("community-chat-feedback"), error.message, true);
    return;
  }
  await closeCommunityOverlay();
  message($("groups-message"), "You left " + room.room_name + ".");
  await loadCommunityRooms();
});

$("community-room-close").addEventListener("click", closeCommunityOverlay);
$("community-room-back").addEventListener("click", closeCommunityOverlay);

$("community-message-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activeCommunityRoom || !currentUser || communityMessageSending) return;
  const input = $("community-message-body"),
    body = input.value.trim();
  if (!body) return;
  const roomId = activeCommunityRoom.id;
  const button = e.currentTarget.querySelector('button[type="submit"]');
  communityMessageSending = true;
  if (button) button.disabled = true;
  input.disabled = true;
  const { error } = await supabase.rpc("send_community_message", {
    p_room_id: roomId,
    p_body: body
  });
  communityMessageSending = false;
  if (button) button.disabled = false;
  input.disabled = false;
  if (error) {
    message($("community-chat-feedback"), error.message, true);
    return;
  }
  input.value = "";
  $("community-emoji-tray")?.classList.add("hidden");
  message(
    $("community-chat-feedback"),
    "Message sent. Slow mode allows one message every 15 seconds."
  );
});

// =========================================================================
// PRIVATE NOTIFICATIONS, DIRECT MESSAGING, IN-APP SHARING & FOLLOWS
// =========================================================================
async function openMemberProfile(userId) {
  if (!userId || userId === currentUser?.id) {
    $("profile-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const panel = $("member-profile-view");
  panel.classList.remove("hidden");
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  message($("public-profile-status"), "Loading member profile…");
  $("public-profile-posts").replaceChildren();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id,username,display_name,bio,personality_type,hobbies")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !profile)
    return message($("public-profile-status"), "This member profile is unavailable.", true);
  $("public-profile-name").textContent = profile.display_name || "SyncTrA member";
  $("public-profile-username").textContent = "@" + profile.username;
  $("public-profile-bio").textContent =
    profile.bio?.trim() || "This member hasn't added a bio yet.";
  $("public-profile-personality").textContent = profile.personality_type || "Not set";
  $("public-profile-hobbies").textContent = profile.hobbies?.trim() || "Not set";
  const { data: relation } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", currentUser.id)
    .eq("followed_id", userId)
    .maybeSingle();
  const follow = $("public-profile-follow");
  follow.textContent = relation ? "Following" : "Follow";
  follow.onclick = async () => {
    follow.disabled = true;
    const result = relation
      ? await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("followed_id", userId)
      : await supabase
          .from("follows")
          .insert({ follower_id: currentUser.id, followed_id: userId });
    follow.disabled = false;
    if (result.error) return message($("public-profile-status"), result.error.message, true);
    await loadNetwork();
    await loadNotifications();
    await openMemberProfile(userId);
  };
  $("public-profile-message").onclick = () => {
    $("message-username").value = profile.username;
    $("messages-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    $("message-first-body").focus();
  };
  const { data: posts, error: postError } = await supabase
    .from("posts")
    .select("id,body,created_at")
    .eq("author_id", userId)
    .eq("visibility", "members")
    .eq("status", "published")
    .is("group_id", null)
    .order("created_at", { ascending: false })
    .limit(12);
  const host = $("public-profile-posts");
  if (postError)
    return message(
      $("public-profile-status"),
      "Profile loaded, but posts could not be displayed.",
      true
    );
  if (!posts?.length) host.append(node("p", "muted", "No public posts yet."));
  for (const post of posts || []) {
    const card = node("article", "panel post-card");
    card.append(node("p", "post-body", post.body), node("small", "post-time", formatDate(post.created_at)));
    host.append(card);
  }
  message(
    $("public-profile-status"),
    "Viewing public profile information. Private account details are not shown."
  );
}
$("close-public-profile")?.addEventListener("click", () =>
  $("member-profile-view").classList.add("hidden")
);

async function profileForUsername(username) {
  const clean = username.trim().replace(/^@/, "");
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,username,display_name")
    .eq("username", clean)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadNotifications() {
  if (!currentUser) return;
  const host = $("notifications-list");
  host.replaceChildren();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,notification_type,reference_id,read_at,created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error)
    return message($("notifications-message"), "Notifications unavailable: " + error.message, true);
  const unread = (data || []).filter((n) => !n.read_at).length;
  const badgeText = unread > 99 ? "99+" : String(unread);
  $("notification-count").textContent = badgeText;
  if ($("header-notif-badge")) $("header-notif-badge").textContent = badgeText;
  if ($("mobile-notif-dot")) {
    $("mobile-notif-dot").textContent = badgeText;
    $("mobile-notif-dot").classList.toggle("hidden", unread === 0);
  }

  if (!data?.length) {
    message(
      $("notifications-message"),
      "You're all caught up. New activity will appear here."
    );
    return;
  }
  const labels = {
    new_follower: "Started following you",
    direct_message: "Sent you a private message",
    post_shared: "Shared a post with you",
    post_reaction: "Reacted to your post",
    post_comment: "Commented on your post"
  };
  for (const n of data) {
    const row = node("div", n.read_at ? "social-row" : "social-row unread");
    const title = node("b", "", labels[n.notification_type] || "New SyncTrA activity");
    const meta = node("small", "", formatDate(n.created_at));
    const mark = node("button", "text-button", n.read_at ? "Read" : "Mark read");
    mark.type = "button";
    mark.addEventListener("click", async () => {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id)
        .eq("user_id", currentUser.id);
      if (updateError) return message($("notifications-message"), updateError.message, true);
      await loadNotifications();
    });
    row.append(title, meta, mark);
    host.append(row);
  }
  message(
    $("notifications-message"),
    `${data.length} recent notification${data.length === 1 ? "" : "s"} · ${unread} unread.`
  );
}

async function loadMessages() {
  if (!currentUser) return;
  const host = $("messages-list");
  host.replaceChildren();
  const { data: rows, error } = await supabase
    .from("direct_messages")
    .select("id,sender_id,recipient_id,body,read_at,created_at")
    .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
    .order("created_at", { ascending: false })
    .limit(80);
  if (error)
    return message($("messages-message"), "Messages unavailable: " + error.message, true);
  if (!rows?.length) {
    message(
      $("messages-message"),
      "Your private inbox is empty. Start a conversation using a member username."
    );
    return;
  }
  const ids = [
    ...new Set(rows.map((r) => (r.sender_id === currentUser.id ? r.recipient_id : r.sender_id)))
  ];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id,username,display_name")
    .in("user_id", ids);
  if (profileError)
    return message(
      $("messages-message"),
      "Could not load conversation members: " + profileError.message,
      true
    );
  const pmap = new Map((profiles || []).map((p) => [p.user_id, p]));
  const conversations = new Map();
  for (const r of rows) {
    const other = r.sender_id === currentUser.id ? r.recipient_id : r.sender_id;
    if (!conversations.has(other)) conversations.set(other, []);
    conversations.get(other).push(r);
  }
  const unreadIncoming = [];
  for (const [other, messages] of conversations) {
    const p = pmap.get(other);
    if (!p) continue;
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const thread = node("section", "social-row message-thread");
    thread.append(node("b", "", `${p.display_name} (@${p.username})`));
    const history = node("div", "message-history");
    for (const r of messages) {
      const mine = r.sender_id === currentUser.id;
      const entry = node("div", mine ? "message-entry message-own" : "message-entry message-incoming");
      entry.append(node("small", "", mine ? "You" : p.display_name));
      entry.append(node("p", "", r.body));
      entry.append(node("small", "", formatDate(r.created_at)));
      history.append(entry);
      if (!mine && !r.read_at) unreadIncoming.push(r.id);
    }
    thread.append(history);
    const form = node("form", "inline-reply");
    const input = node("input", "comment-input");
    input.maxLength = 4000;
    input.required = true;
    input.placeholder = "Reply privately…";
    const send = node("button", "secondary", "Send");
    send.type = "submit";
    form.append(input, send);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = input.value.trim();
      if (!body) return;
      send.disabled = true;
      const { error: sendError } = await supabase
        .from("direct_messages")
        .insert({ sender_id: currentUser.id, recipient_id: other, body });
      send.disabled = false;
      if (sendError)
        return message($("messages-message"), "Message not sent: " + sendError.message, true);
      await loadMessages();
      await loadNotifications();
    });
    thread.append(form);
    host.append(thread);
  }
  if (unreadIncoming.length) {
    const { error: readError } = await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIncoming);
    if (readError)
      message(
        $("messages-message"),
        "Messages loaded, but read status could not be updated: " + readError.message,
        true
      );
  }
  message(
    $("messages-message"),
    "Conversation history is preserved and displayed. Messages are visible only to their sender and recipient."
  );
}

async function loadNetwork() {
  if (!currentUser) return;
  const [{ data: followers, error: e1 }, { data: following, error: e2 }] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id,created_at")
      .eq("followed_id", currentUser.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("follows")
      .select("followed_id,created_at")
      .eq("follower_id", currentUser.id)
      .order("created_at", { ascending: false })
  ]);
  if (e1 || e2) return message($("network-message"), (e1 || e2).message, true);
  $("followers-count").textContent = (followers || []).length;
  $("following-count").textContent = (following || []).length;
  $("profile-followers").textContent = (followers || []).length;
  $("profile-following").textContent = (following || []).length;
  const ids = [
    ...(followers || []).map((x) => x.follower_id),
    ...(following || []).map((x) => x.followed_id)
  ];
  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("user_id,username,display_name")
        .in("user_id", [...new Set(ids)])
    : { data: [] };
  const pmap = new Map((profiles || []).map((p) => [p.user_id, p]));
  const fill = (id, rows, key, allowUnfollow) => {
    const host = $(id);
    host.replaceChildren();
    if (!rows?.length) {
      host.append(node("small", "muted", "No members yet."));
      return;
    }
    for (const r of rows) {
      const p = pmap.get(r[key]);
      if (!p) continue;
      const line = node("div", "network-person");
      line.append(node("span", "", `${p.display_name} · @${p.username}`));
      if (allowUnfollow) {
        const b = node("button", "text-button", "Unfollow");
        b.type = "button";
        b.addEventListener("click", async () => {
          const { error } = await supabase
            .from("follows")
            .delete()
            .eq("follower_id", currentUser.id)
            .eq("followed_id", p.user_id);
          if (error) return message($("network-message"), error.message, true);
          await loadNetwork();
        });
        line.append(b);
      }
      host.append(line);
    }
  };
  fill("followers-list", followers, "follower_id", false);
  fill("following-list", following, "followed_id", true);
  message($("network-message"), "Follow relationships are private to signed-in SyncTrA members.");
}

$("follow-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  try {
    const profile = await profileForUsername($("follow-username").value);
    if (!profile) return message($("network-message"), "No active member found with that username.", true);
    if (profile.user_id === currentUser.id)
      return message($("network-message"), "You cannot follow your own account.", true);
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: currentUser.id, followed_id: profile.user_id });
    if (error)
      return message(
        $("network-message"),
        error.code === "23505" ? "You're already following this member." : error.message,
        true
      );
    form.reset();
    await loadNetwork();
    await loadNotifications();
  } catch (err) {
    message($("network-message"), err.message, true);
  }
});

$("new-message-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  try {
    const profile = await profileForUsername($("message-username").value);
    if (!profile)
      return message($("messages-message"), "No active member found with that username.", true);
    if (profile.user_id === currentUser.id)
      return message($("messages-message"), "You cannot message yourself.", true);
    const body = $("message-first-body").value.trim();
    if (!body) return;
    const { error } = await supabase
      .from("direct_messages")
      .insert({ sender_id: currentUser.id, recipient_id: profile.user_id, body });
    if (error) return message($("messages-message"), error.message, true);
    form.reset();
    await loadMessages();
    await loadNotifications();
  } catch (err) {
    message($("messages-message"), err.message, true);
  }
});

$("refresh-notifications").addEventListener("click", loadNotifications);
$("refresh-messages").addEventListener("click", loadMessages);
$("refresh-network").addEventListener("click", loadNetwork);
$("group-side-notifications")?.addEventListener("click", () => {
  $("notifications-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
});
$("profile-logout")?.addEventListener("click", () => $("logout-button")?.click());

// =========================================================================
// MODERATOR CENTER
// =========================================================================
async function loadModeratorQueue() {
  const panel = $("moderator-panel");
  const host = $("moderator-queue");
  const status = $("moderator-message");
  if (!currentUser || !panel || !host || !status) return;
  status.textContent = "Checking administrator access…";
  host.replaceChildren();

  const { data, error } = await supabase.rpc("synctra_moderation_queue");
  if (error || !Array.isArray(data)) {
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  status.textContent = `${data.length} report(s) waiting for review.`;
  await loadModeratorAppeals();
  if (!data.length) {
    host.append(node("p", "muted", "No reports are waiting for review."));
    return;
  }

  for (const report of data) {
    const card = node("article", "panel moderation-card");
    const heading = node("h3", "", `${report.target_type} report · ${report.report_status}`);
    const reason = node("p", "moderation-reason", report.reason);
    const meta = node("small", "", `Report ID: ${report.report_id} · ${formatDate(report.created_at)}`);
    const label = node("label", "moderation-label", "Decision explanation");
    const note = node("textarea", "moderation-note");
    note.maxLength = 2000;
    note.rows = 3;
    note.placeholder = "Explain the policy reason and action…";
    label.append(note);
    const actions = node("div", "group-card-actions");
    for (const [caption, nextStatus] of [
      ["Mark reviewing", "reviewing"],
      ["Take action", "actioned"],
      ["Dismiss report", "dismissed"]
    ]) {
      const button = node("button", "secondary", caption);
      button.type = "button";
      button.addEventListener("click", async () => {
        const explanation = note.value.trim();
        if (nextStatus !== "reviewing" && explanation.length < 5) {
          message(
            status,
            "Enter an explanation of at least 5 characters before a final decision.",
            true
          );
          return;
        }
        button.disabled = true;
        const { error: saveError } = await supabase.rpc("synctra_review_report", {
          p_report_id: report.report_id,
          p_status: nextStatus,
          p_note: explanation
        });
        button.disabled = false;
        if (saveError) {
          message(status, "Decision could not be saved: " + saveError.message, true);
          return;
        }
        message(status, "Decision saved to the audit log.");
        await loadModeratorQueue();
      });
      actions.append(button);
    }
    card.append(heading, reason, meta, label, actions);
    host.append(card);
  }
}

async function loadMyReports() {
  const host = $("my-reports-list");
  const status = $("my-reports-message");
  if (!currentUser || !host || !status) return;
  host.replaceChildren();
  const { data: reports, error } = await supabase
    .from("content_reports")
    .select("id,target_type,reason,report_status,created_at")
    .eq("reporter_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return message(status, "Your reports could not be loaded: " + error.message, true);
  if (!reports?.length) return message(status, "You have not submitted any reports.");

  const reportIds = reports.map((r) => r.id);
  const { data: appeals, error: appealError } = await supabase
    .from("moderation_appeals")
    .select("id,report_id,appeal_reason,appeal_status,moderator_note,created_at")
    .eq("appellant_id", currentUser.id)
    .in("report_id", reportIds);
  if (appealError)
    return message(status, "Appeal status could not be loaded: " + appealError.message, true);
  const appealMap = new Map((appeals || []).map((a) => [a.report_id, a]));

  for (const report of reports) {
    const card = node("article", "panel member-report-card");
    const heading = node(
      "h4",
      "",
      `${report.target_type.replaceAll("_", " ")} · ${report.report_status}`
    );
    const reason = node("p", "moderation-reason", report.reason);
    const meta = node("small", "", `Submitted ${formatDate(report.created_at)}`);
    card.append(heading, reason, meta);
    const appeal = appealMap.get(report.id);
    if (appeal) {
      const appealStatus = node("p", "appeal-status", `Appeal: ${appeal.appeal_status}`);
      card.append(appealStatus);
      if (appeal.moderator_note)
        card.append(node("p", "muted", `Moderator response: ${appeal.moderator_note}`));
      card.append(node("small", "", `Appeal submitted ${formatDate(appeal.created_at)}`));
    } else if (["actioned", "dismissed"].includes(report.report_status)) {
      const label = node("label", "moderation-label", "Request an appeal (10–2,000 characters)");
      const field = node("textarea", "moderation-note");
      field.rows = 3;
      field.maxLength = 2000;
      field.placeholder = "Explain why you believe the decision should be reviewed…";
      const submit = node("button", "secondary", "Submit appeal");
      submit.type = "button";
      submit.addEventListener("click", async () => {
        const text = field.value.trim();
        if (text.length < 10)
          return message(
            status,
            "Please provide at least 10 characters explaining your appeal.",
            true
          );
        submit.disabled = true;
        const { error: saveError } = await supabase.from("moderation_appeals").insert({
          report_id: report.id,
          appellant_id: currentUser.id,
          appeal_reason: text
        });
        submit.disabled = false;
        if (saveError)
          return message(
            status,
            saveError.code === "23505"
              ? "An appeal already exists for this report."
              : "Appeal could not be submitted: " + saveError.message,
            true
          );
        message(status, "Your appeal has been submitted for moderator review.");
        await loadMyReports();
      });
      label.append(field);
      card.append(label, submit);
    }
    host.append(card);
  }
  message(status, `${reports.length} report(s) shown.`);
}

async function loadModeratorAppeals() {
  const host = $("moderator-appeals");
  const status = $("moderator-message");
  if (!host || !status) return;
  host.replaceChildren();
  const { data, error } = await supabase.rpc("synctra_appeal_queue");
  if (error) {
    host.append(node("p", "muted", "Appeal queue unavailable: " + error.message));
    return;
  }
  if (!data?.length) {
    host.append(node("p", "muted", "No appeals are waiting for review."));
    return;
  }
  for (const appeal of data) {
    const card = node("article", "panel moderation-card");
    card.append(node("h4", "", `Appeal · ${appeal.appeal_status}`));
    card.append(node("p", "moderation-reason", appeal.appeal_reason));
    card.append(
      node(
        "small",
        "",
        `${appeal.appellant_name} (@${appeal.appellant_username || "member"}) · ${
          appeal.target_type
        } · ${formatDate(appeal.appeal_created_at)}`
      )
    );
    card.append(node("p", "muted", `Original report: ${appeal.report_reason}`));
    const label = node("label", "moderation-label", "Moderator decision note");
    const note = node("textarea", "moderation-note");
    note.rows = 3;
    note.maxLength = 2000;
    note.placeholder = "Explain the appeal decision…";
    label.append(note);
    const actions = node("div", "group-card-actions");
    for (const [caption, nextStatus] of [
      ["Mark reviewing", "reviewing"],
      ["Accept appeal", "accepted"],
      ["Reject appeal", "rejected"]
    ]) {
      const button = node("button", nextStatus === "accepted" ? "primary" : "secondary", caption);
      button.type = "button";
      button.addEventListener("click", async () => {
        const explanation = note.value.trim();
        if (nextStatus !== "reviewing" && explanation.length < 5)
          return message(
            status,
            "Add at least 5 characters explaining the final decision.",
            true
          );
        button.disabled = true;
        const { error: saveError } = await supabase.rpc("synctra_review_appeal", {
          p_appeal_id: appeal.appeal_id,
          p_status: nextStatus,
          p_note: explanation
        });
        button.disabled = false;
        if (saveError)
          return message(status, "Appeal decision could not be saved: " + saveError.message, true);
        message(status, "Appeal decision saved to the audit log.");
        await loadModeratorQueue();
      });
      actions.append(button);
    }
    card.append(label, actions);
    host.append(card);
  }
}

$("moderator-refresh")?.addEventListener("click", loadModeratorQueue);

$("logout-button").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return message(dashboardMessage, error.message, true);
  currentUser = null;
  currentProfile = null;
  currentSubscription = null;
  document.querySelectorAll(".auth-only-link").forEach((el) => el.classList.add("hidden"));
  dashboardView.classList.add("hidden");
  authView.classList.remove("hidden");
  $("login-form").reset();
  showTab("login");
});

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    currentUser = null;
    currentProfile = null;
    currentSubscription = null;
    document.querySelectorAll(".auth-only-link").forEach((el) => el.classList.add("hidden"));
    dashboardView.classList.add("hidden");
    authView.classList.remove("hidden");
  }
});

const {
  data: { session }
} = await supabase.auth.getSession();
if (session?.user) await loadMember(session.user);

// =========================================================================
// MOBILE QUICK MENU & WORKSPACE NAVIGATION
// =========================================================================
const closeQuickMenu = () => {
  $("quick-menu")?.classList.remove("menu-open");
  $("quick-menu-toggle")?.setAttribute("aria-expanded", "false");
};
$("quick-menu-toggle")?.addEventListener("click", () => {
  const menu = $("quick-menu");
  const open = menu.classList.toggle("menu-open");
  $("quick-menu-toggle").setAttribute("aria-expanded", String(open));
});
$("quick-menu")
  ?.querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeQuickMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeQuickMenu();
});
document.addEventListener("click", (event) => {
  if (!$("quick-menu")?.classList.contains("menu-open")) return;
  if (event.target.closest("#quick-menu, #quick-menu-toggle")) return;
  closeQuickMenu();
});

(() => {
  const dashboard = $("dashboard-view");
  const memberContent = $("member-content");
  const drawer = $("quick-menu");
  const drawerLinks = [...(drawer?.querySelectorAll('a[href^="#"]') || [])].filter(
    (a) => !a.classList.contains("app-nav-brand")
  );
  const bottomLinks = [...document.querySelectorAll(".mobile-bottom-nav a[href^='#']")];
  const quickbarLinks = [...document.querySelectorAll(".mobile-quickbar a[href^='#']")];
  const topAuthLinks = [...document.querySelectorAll(".top-nav .auth-only-link[href^='#']")];
  const profileJumpLinks = [
    ...document.querySelectorAll("#profile-jump-safety[href^='#']")
  ];
  const allLinks = [
    ...new Set([
      ...drawerLinks,
      ...bottomLinks,
      ...quickbarLinks,
      ...topAuthLinks,
      ...profileJumpLinks
    ])
  ];
  let activeTarget = "feed-section";

  function focusWorkspace(targetId, sourceLink = null, scroll = true) {
    const resolvedId = targetId === "profile-card" ? "profile-section" : targetId;
    const target = $(resolvedId);
    if (!target || !memberContent || !memberContent.contains(target)) return;

    let branch = target;
    while (branch && branch !== memberContent) {
      const parent = branch.parentElement;
      if (!parent) break;
      for (const sibling of parent.children) {
        if (sibling === branch) continue;
        sibling.classList.add("workspace-collapsed");
      }
      branch.classList.remove("workspace-collapsed");
      branch = parent;
    }

    activeTarget = resolvedId;
    allLinks.forEach((link) => {
      const hrefId = link.getAttribute("href")?.slice(1);
      const active =
        hrefId === resolvedId ||
        (link.dataset.workspace === "stream" && resolvedId === "feed-section") ||
        (link.dataset.workspace === "garden" && resolvedId === "groups-section") ||
        (link.dataset.workspace === "create" && resolvedId === "creative-space") ||
        (link.dataset.workspace === "chat" && resolvedId === "messages-panel") ||
        (link.dataset.workspace === "you" && resolvedId === "profile-section");
      link.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    if (sourceLink && drawer?.contains(sourceLink)) closeQuickMenu();
    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  allLinks.forEach((link) =>
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href")?.slice(1);
      const resolvedId = targetId === "profile-card" ? "profile-section" : targetId;
      if (!resolvedId || !$(resolvedId) || !memberContent.contains($(resolvedId))) return;
      event.preventDefault();
      focusWorkspace(resolvedId, link);
    })
  );

  const observer = new MutationObserver(() => {
    if (!dashboard.classList.contains("hidden") && !dashboard.dataset.workspaceReady) {
      dashboard.dataset.workspaceReady = "true";
      focusWorkspace("feed-section", null, false);
    }
    if (dashboard.classList.contains("hidden")) delete dashboard.dataset.workspaceReady;
  });
  observer.observe(dashboard, { attributes: true, attributeFilter: ["class"] });

  // Swipeable Creative Gallery + Explore Filters
  const galleryTrack = $("ai-gallery-track");
  if (galleryTrack) {
    const gallerySlides = [...galleryTrack.querySelectorAll(".gallery-slide")];
    const galleryDots = [...document.querySelectorAll("#gallery-dots .gallery-dot")];
    const galleryCount = $("gallery-count");
    let galleryIndex = 0;

    const getVisibleSlides = () =>
      gallerySlides.filter((s) => !s.classList.contains("is-filtered-out"));

    const setGalleryIndex = (index) => {
      const visible = getVisibleSlides();
      if (!visible.length) return;
      galleryIndex = Math.max(0, Math.min(visible.length - 1, index));
      visible[galleryIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
      galleryDots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === galleryIndex);
        if (i === galleryIndex) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (galleryCount)
        galleryCount.textContent = `${String(galleryIndex + 1).padStart(2, "0")} / ${String(
          visible.length
        ).padStart(2, "0")}`;
    };

    document.querySelectorAll(".gallery-filter").forEach((filterBtn) => {
      filterBtn.addEventListener("click", () => {
        const cat = filterBtn.dataset.filter;
        document
          .querySelectorAll(".gallery-filter")
          .forEach((b) => b.classList.toggle("is-active", b === filterBtn));
        gallerySlides.forEach((slide) => {
          const match = cat === "all" || slide.dataset.category === cat;
          slide.classList.toggle("is-filtered-out", !match);
        });
        setGalleryIndex(0);
      });
    });

    $("gallery-prev")?.addEventListener("click", () => {
      const len = getVisibleSlides().length || 1;
      setGalleryIndex((galleryIndex - 1 + len) % len);
    });
    $("gallery-next")?.addEventListener("click", () => {
      const len = getVisibleSlides().length || 1;
      setGalleryIndex((galleryIndex + 1) % len);
    });
    galleryDots.forEach((dot, i) => dot.addEventListener("click", () => setGalleryIndex(i)));

    let galleryScrollTimer;
    galleryTrack.addEventListener(
      "scroll",
      () => {
        clearTimeout(galleryScrollTimer);
        galleryScrollTimer = setTimeout(() => {
          const visible = getVisibleSlides();
          const center = galleryTrack.getBoundingClientRect().left + galleryTrack.clientWidth / 2;
          let nearest = 0,
            distance = Infinity;
          visible.forEach((slide, i) => {
            const rect = slide.getBoundingClientRect();
            const d = Math.abs(rect.left + rect.width / 2 - center);
            if (d < distance) {
              distance = d;
              nearest = i;
            }
          });
          galleryIndex = nearest;
          galleryDots.forEach((dot, i) => {
            dot.classList.toggle("is-active", i === nearest);
            if (i === nearest) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
          });
          if (galleryCount)
            galleryCount.textContent = `${String(nearest + 1).padStart(2, "0")} / ${String(
              visible.length
            ).padStart(2, "0")}`;
        }, 90);
      },
      { passive: true }
    );
    $("gallery-join")?.addEventListener("click", () => $("welcome-evolve")?.click());
  }

  // Swipe horizontally between the five primary mobile destinations
  const primary = [
    "feed-section",
    "groups-section",
    "creative-space",
    "messages-panel",
    "profile-section"
  ];
  let sx = 0,
    sy = 0,
    started = 0;
  const ignored =
    'input,textarea,select,button,a,[contenteditable="true"],.app-nav,.feed-list,.community-chat-list,.group-chat-list';
  dashboard.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1 || event.target.closest(ignored)) return;
      sx = event.touches[0].clientX;
      sy = event.touches[0].clientY;
      started = Date.now();
    },
    { passive: true }
  );
  dashboard.addEventListener(
    "touchend",
    (event) => {
      if (!started || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - sx,
        dy = event.changedTouches[0].clientY - sy;
      const elapsed = Date.now() - started;
      started = 0;
      if (Math.abs(dx) < 75 || Math.abs(dx) < Math.abs(dy) * 1.3 || elapsed > 700) return;
      const index = primary.indexOf(activeTarget);
      if (index < 0) return;
      const next = Math.max(0, Math.min(primary.length - 1, index + (dx < 0 ? 1 : -1)));
      focusWorkspace(primary[next]);
    },
    { passive: true }
  );
})();
