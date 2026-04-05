/* ═══════════════════════════════════════════
   ASTRA DESKTOP — APP LOGIC
   ═══════════════════════════════════════════ */

// ─── State ───
let currentUser = null;
let currentLicense = null;
let gameModeActive = false;
let systemInfoInterval = null;

// ─── Tweaks definition ───
const TWEAKS = [
  { id: "disable-telemetry", name: "Отключение телеметрии", desc: "Отключает сбор данных Windows для снижения фоновой нагрузки", icon: "🛡️", pro: false },
  { id: "clean-ram", name: "Очистка оперативной памяти", desc: "Освобождает неиспользуемую RAM для текущих приложений", icon: "🧹", pro: false },
  { id: "disable-autostart", name: "Управление автозагрузкой", desc: "Отключает ненужные программы из автозагрузки Windows", icon: "🚀", pro: false },
  { id: "power-plan", name: "Схема питания — Высокая", desc: "Переключает Windows на высокопроизводительную схему питания", icon: "⚡", pro: false },
  { id: "visual-effects", name: "Минимизация визуальных эффектов", desc: "Отключает анимации и прозрачность Windows для прироста FPS", icon: "🖥️", pro: false },
  { id: "network-optimize", name: "Оптимизация сети", desc: "Настройка TCP/IP параметров для снижения пинга", icon: "🌐", pro: false },
  { id: "gpu-priority", name: "Приоритет GPU", desc: "Устанавливает максимальный приоритет для видеокарты в играх", icon: "🎮", pro: true },
  { id: "cpu-affinity", name: "Настройка CPU Affinity", desc: "Оптимизация распределения ядер процессора для игр", icon: "🔧", pro: true },
  { id: "fps-boost", name: "FPS Boost", desc: "Комплексная настройка системы для максимального FPS в играх", icon: "📈", pro: true },
  { id: "registry-tweaks", name: "Твики реестра", desc: "Оптимизация скрытых настроек Windows через реестр", icon: "📝", pro: true },
  { id: "service-manager", name: "Управление службами", desc: "Отключение ненужных системных служб Windows", icon: "⚙️", pro: true },
  { id: "advanced-cleanup", name: "Глубокая очистка", desc: "Удаление временных файлов, кеша и журналов системы", icon: "🗑️", pro: true },
];

// ─── DOM Helpers ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── Navigation ───
function switchTab(tabName) {
  $$(".nav-item").forEach((btn) => btn.classList.remove("active"));
  $$(`.nav-item[data-tab="${tabName}"]`).forEach((btn) => btn.classList.add("active"));

  $$(".tab-panel").forEach((panel) => panel.classList.remove("active"));
  const target = $(`.tab-panel[data-panel="${tabName}"]`);
  if (target) target.classList.add("active");
}

function switchScreen(screenName) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  $(`#screen-${screenName}`)?.classList.add("active");
}

// ─── Auth ───
async function handleLogin() {
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  const errorEl = $("#login-error");
  const btn = $("#btn-login");
  const btnText = btn.querySelector(".btn-text");
  const btnLoader = btn.querySelector(".btn-loader");

  if (!email || !password) {
    errorEl.textContent = "Введите email и пароль";
    return;
  }

  errorEl.textContent = "";
  btn.disabled = true;
  btnText.textContent = "Входим...";
  btnLoader.hidden = false;

  try {
    const result = await window.astra.login(email, password);
    if (result.ok) {
      currentUser = result.user;
      currentLicense = result.license;
      enterApp();
    } else {
      errorEl.textContent = result.error || "Ошибка входа";
    }
  } catch (err) {
    errorEl.textContent = "Сервер недоступен. Проверьте подключение.";
  }

  btn.disabled = false;
  btnText.textContent = "Войти";
  btnLoader.hidden = true;
}

async function handleLogout() {
  await window.astra.logout();
  currentUser = null;
  currentLicense = null;
  gameModeActive = false;
  clearInterval(systemInfoInterval);
  switchScreen("login");
  $("#login-email").value = "";
  $("#login-password").value = "";
  $("#login-error").textContent = "";
}

async function checkSession() {
  try {
    const result = await window.astra.getSession();
    if (result.ok) {
      currentUser = result.user;
      currentLicense = result.license;
      enterApp();
      return;
    }
  } catch {}
  switchScreen("login");
}

// ─── Enter App ───
function enterApp() {
  switchScreen("app");
  updateUserUI();
  updateProUI();
  renderTweaks();
  renderProTweaks();
  updateSystemInfo();
  startSystemMonitor();
  switchTab("dashboard");
}

function updateUserUI() {
  if (!currentUser) return;
  $("#user-name").textContent = currentUser.name || currentUser.email;
  const plan = currentLicense?.plan || currentUser?.plan || "FREE";
  const planLabel = plan === "LIFETIME" ? "Lifetime" : plan === "PRO" ? "Pro" : "Free";
  $("#user-plan").textContent = planLabel;
  $("#user-avatar").textContent = (currentUser.name || currentUser.email || "A").charAt(0).toUpperCase();
}

function updateProUI() {
  const hasPro = currentLicense?.active === true;
  const proStatus = $("#pro-status");
  const proStatusText = $("#pro-status-text");
  const proLocked = $("#pro-locked");
  const proContent = $("#pro-content");
  const navPro = $("#nav-pro");

  if (hasPro) {
    proStatus.classList.add("active");
    proStatusText.textContent = "Активен";
    proLocked.style.display = "none";
    proContent.style.display = "block";
    navPro.querySelector(".pro-badge").style.background = "linear-gradient(135deg, #16a34a, #22c55e)";
  } else {
    proStatus.classList.remove("active");
    proStatusText.textContent = "Не активен";
    proLocked.style.display = "flex";
    proContent.style.display = "none";
  }
}

// ─── Tweaks ───
async function renderTweaks() {
  const container = $("#tweaks-list");
  const { appliedTweaks } = await window.astra.getOptimizeStatus();
  const hasPro = currentLicense?.active === true;

  const freeTweaks = TWEAKS.filter((t) => !t.pro);
  container.innerHTML = freeTweaks
    .map((tweak, i) => {
      const applied = appliedTweaks.includes(tweak.id);
      return `
        <div class="tweak-card ${applied ? "applied" : ""}" style="animation-delay: ${i * 40}ms" data-tweak="${tweak.id}">
          <div class="tweak-icon">${tweak.icon}</div>
          <div class="tweak-info">
            <div class="tweak-name">${tweak.name}</div>
            <div class="tweak-desc">${tweak.desc}</div>
          </div>
          <div class="tweak-toggle">
            <label class="toggle">
              <input type="checkbox" ${applied ? "checked" : ""} data-tweak-toggle="${tweak.id}" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      `;
    })
    .join("");

  // Event listeners
  container.querySelectorAll("[data-tweak-toggle]").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const id = e.target.dataset.tweakToggle;
      if (e.target.checked) {
        await window.astra.applyTweak(id);
      } else {
        await window.astra.revertTweak(id);
      }
      const card = e.target.closest(".tweak-card");
      card.classList.toggle("applied", e.target.checked);
      updateTweakCount();
    });
  });

  updateTweakCount();
}

async function renderProTweaks() {
  const container = $("#pro-tweaks");
  if (!container) return;
  const { appliedTweaks } = await window.astra.getOptimizeStatus();

  const proTweaks = TWEAKS.filter((t) => t.pro);
  container.innerHTML = proTweaks
    .map((tweak, i) => {
      const applied = appliedTweaks.includes(tweak.id);
      return `
        <div class="tweak-card ${applied ? "applied" : ""}" style="animation-delay: ${i * 40}ms">
          <div class="tweak-icon">${tweak.icon}</div>
          <div class="tweak-info">
            <div class="tweak-name">${tweak.name} <span class="tweak-pro-tag">PRO</span></div>
            <div class="tweak-desc">${tweak.desc}</div>
          </div>
          <div class="tweak-toggle">
            <label class="toggle">
              <input type="checkbox" ${applied ? "checked" : ""} data-pro-tweak-toggle="${tweak.id}" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll("[data-pro-tweak-toggle]").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const id = e.target.dataset.proTweakToggle;
      if (e.target.checked) {
        await window.astra.applyTweak(id);
      } else {
        await window.astra.revertTweak(id);
      }
      const card = e.target.closest(".tweak-card");
      card.classList.toggle("applied", e.target.checked);
      updateTweakCount();
    });
  });
}

async function updateTweakCount() {
  const { appliedTweaks } = await window.astra.getOptimizeStatus();
  $("#stat-tweaks").textContent = `${appliedTweaks.length} / ${TWEAKS.length}`;
}

// ─── System Monitor ───
async function updateSystemInfo() {
  try {
    const info = await window.astra.getSystemInfo();

    const usedMem = info.totalMemory - info.freeMemory;
    const memPercent = Math.round((usedMem / info.totalMemory) * 100);
    const totalGB = (info.totalMemory / 1073741824).toFixed(1);
    const usedGB = (usedMem / 1073741824).toFixed(1);

    // Dashboard stats
    const cpuPercent = Math.round(Math.random() * 30 + 10); // Simulated, real monitoring needs native addon
    $("#stat-cpu").textContent = `${cpuPercent}%`;
    $("#bar-cpu").style.width = `${cpuPercent}%`;

    $("#stat-ram").textContent = `${usedGB} / ${totalGB} ГБ`;
    $("#bar-ram").style.width = `${memPercent}%`;

    const hours = Math.floor(info.uptime / 3600);
    const mins = Math.floor((info.uptime % 3600) / 60);
    $("#stat-uptime").textContent = `${hours}ч ${mins}м`;

    // Monitor tab
    const grid = $("#sys-info-grid");
    grid.innerHTML = [
      { label: "Процессор", value: info.cpuModel },
      { label: "Ядра", value: `${info.cpus} потоков` },
      { label: "Платформа", value: `Windows ${info.osVersion}` },
      { label: "Архитектура", value: info.arch },
      { label: "RAM всего", value: `${totalGB} ГБ` },
      { label: "RAM свободно", value: `${(info.freeMemory / 1073741824).toFixed(1)} ГБ` },
      { label: "Использование RAM", value: `${memPercent}%` },
      { label: "Аптайм системы", value: `${hours}ч ${mins}м` },
      { label: "Имя компьютера", value: info.hostname },
      { label: "Версия Astra", value: `v${info.appVersion}` },
    ]
      .map(
        (item, i) => `
        <div class="sys-info-card" style="animation-delay: ${i * 30}ms">
          <div class="sys-info-label">${item.label}</div>
          <div class="sys-info-value">${item.value}</div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("System info error:", err);
  }
}

function startSystemMonitor() {
  clearInterval(systemInfoInterval);
  systemInfoInterval = setInterval(updateSystemInfo, 5000);
}

// ─── Game Mode ───
function toggleGameMode() {
  gameModeActive = !gameModeActive;
  const btn = $("#btn-game-toggle");
  const ring = $("#gm-ring");
  const progress = $("#gm-progress");
  const statusText = $("#gm-status-text");

  if (gameModeActive) {
    btn.textContent = "Деактивировать";
    btn.classList.add("active");
    ring.classList.add("active");
    progress.style.strokeDashoffset = "0";
    statusText.textContent = "Игровой режим активен";

    // Apply game-related tweaks
    TWEAKS.filter((t) => ["gpu-priority", "clean-ram", "fps-boost", "visual-effects"].includes(t.id)).forEach((t) => {
      window.astra.applyTweak(t.id);
    });
  } else {
    btn.textContent = "Активировать";
    btn.classList.remove("active");
    ring.classList.remove("active");
    progress.style.strokeDashoffset = "339.3";
    statusText.textContent = "Игровой режим выключен";
  }

  updateTweakCount();
}

// ─── Quick Actions ───
async function quickOptimize() {
  const freeTweaks = TWEAKS.filter((t) => !t.pro);
  for (const tweak of freeTweaks) {
    await window.astra.applyTweak(tweak.id);
  }
  await renderTweaks();
  updateTweakCount();
}

async function quickCleanRam() {
  await window.astra.applyTweak("clean-ram");
  await renderTweaks();
  updateTweakCount();
}

async function quickRevert() {
  await window.astra.revertAll();
  gameModeActive = false;
  const btn = $("#btn-game-toggle");
  btn.textContent = "Активировать";
  btn.classList.remove("active");
  $("#gm-ring").classList.remove("active");
  $("#gm-progress").style.strokeDashoffset = "339.3";
  $("#gm-status-text").textContent = "Игровой режим выключен";
  await renderTweaks();
  await renderProTweaks();
  updateTweakCount();
}

// ─── Init ───
document.addEventListener("DOMContentLoaded", () => {
  // Navigation
  $$(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Login
  $("#btn-login").addEventListener("click", handleLogin);
  $("#login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  $("#login-email").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#login-password").focus();
  });

  // Register link
  $("#link-register")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.astra.openExternal("https://astraboost.ru/register");
  });

  // Logout
  $("#btn-logout").addEventListener("click", handleLogout);

  // Game mode
  $("#btn-game-toggle").addEventListener("click", toggleGameMode);

  // Quick actions
  $("#quick-optimize")?.addEventListener("click", quickOptimize);
  $("#quick-clean-ram")?.addEventListener("click", quickCleanRam);
  $("#quick-game-mode")?.addEventListener("click", () => {
    switchTab("gaming");
    if (!gameModeActive) toggleGameMode();
  });
  $("#quick-revert")?.addEventListener("click", quickRevert);

  // Pro upgrade
  $("#btn-upgrade")?.addEventListener("click", () => window.astra.openPricing());

  // Settings
  $("#btn-open-pricing")?.addEventListener("click", () => window.astra.openPricing());
  $("#btn-open-support")?.addEventListener("click", () => window.astra.openExternal("https://astraboost.ru/support"));
  $("#btn-revert-all")?.addEventListener("click", quickRevert);
  $("#link-site")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.astra.openExternal("https://astraboost.ru");
  });

  // Settings toggles
  $("#setting-tray")?.addEventListener("change", (e) => {
    window.astra.storeSet("minimizeToTray", e.target.checked);
  });
  $("#setting-autostart")?.addEventListener("change", (e) => {
    window.astra.storeSet("autoStart", e.target.checked);
  });

  // Load stored settings
  (async () => {
    const tray = await window.astra.storeGet("minimizeToTray");
    const autostart = await window.astra.storeGet("autoStart");
    if (tray !== undefined) $("#setting-tray").checked = tray;
    if (autostart !== undefined) $("#setting-autostart").checked = autostart;
  })();

  // Window maximize tracking
  window.astra.onMaximizeChange?.((isMax) => {
    // Could update maximize button icon here
  });

  // Check session
  checkSession();
});
