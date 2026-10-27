(() => {
  const STORAGE_KEY = 'daymark.browser.v1';
  const THEME_KEY = 'daymark.theme.v1';
  const defaults = () => ({
    user: { name: 'Friend' }, tasks: [], entries: [],
    preferences: { focus_window: 'flexible', wake_time: '', bed_time: '' }
  });
  function readState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return defaults();
      return { ...defaults(), ...saved, user: { ...defaults().user, ...(saved.user || {}) },
        tasks: Array.isArray(saved.tasks) ? saved.tasks : [], entries: Array.isArray(saved.entries) ? saved.entries.map(entry => ({ ...entry, mood: entry.mood || ({ 1: '😔 Low', 2: '😮‍💨 Tired', 3: '🙂 Okay', 4: '😄 Great', 5: '😄 Great' }[entry.energy] || '') })) : [],
        preferences: { ...defaults().preferences, ...(saved.preferences || {}) } };
    } catch { return defaults(); }
  }
  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updated_at: new Date().toISOString() })); }
    catch { throw new Error('Daymark could not save this change in your browser. Check available storage, then try again.'); }
  }
  async function api(path, options = {}) {
    const state = readState(), method = (options.method || 'GET').toUpperCase(), body = options.body || {};
    if (path === '/api/auth/me') return { user: state.user };
    if (path === '/api/auth/logout') return { ok: true };
    if (path === '/api/tasks' && method === 'GET') return { tasks: state.tasks };
    if (path === '/api/tasks' && method === 'PUT') { state.tasks = Array.isArray(body.tasks) ? body.tasks : []; writeState(state); return { tasks: state.tasks }; }
    if (path === '/api/journal' && method === 'GET') return { entries: state.entries };
    if (path === '/api/journal' && method === 'PUT') {
      const byDate = new Map(state.entries.map(entry => [entry.date, entry]));
      (Array.isArray(body.entries) ? body.entries : []).forEach(entry => byDate.set(entry.date, entry));
      state.entries = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date)); writeState(state); return { entries: state.entries };
    }
    if (path === '/api/preferences' && method === 'GET') return { preferences: state.preferences };
    if (path === '/api/preferences' && method === 'PUT') { state.preferences = { ...state.preferences, ...(body.preferences || {}) }; writeState(state); return { preferences: state.preferences }; }
    if (path === '/api/profile' && method === 'PUT') { state.user = { ...state.user, name: String(body.name || '').trim().slice(0, 60) || 'Friend' }; writeState(state); return { user: state.user }; }
    throw new Error('That Daymark action is not available.');
  }
  function toast(message, kind = 'info') {
    const region = document.querySelector('[data-toast-region]'); if (!region) return;
    const item = document.createElement('div'); item.className = `toast toast-${kind}`; item.textContent = message; region.append(item);
    window.setTimeout(() => item.remove(), 4500);
  }
  function todayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function formatTime(value) {
    if (!value) return '';
    const [hour, minute] = value.split(':').map(Number), date = new Date(); date.setHours(hour, minute, 0, 0);
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  }
  function safe(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  function download(name, data, type) {
    const url = URL.createObjectURL(new Blob([data], { type })), link = document.createElement('a');
    link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportBackup() {
    download(`daymark-backup-${todayKey()}.json`, JSON.stringify({ format: 'daymark-browser-backup-v1', exported_at: new Date().toISOString(), ...readState() }, null, 2), 'application/json');
    toast('Your Daymark backup has been downloaded.', 'success');
  }
  function exportJournalJson() {
    const state = readState();
    download(`daymark-journal-${todayKey()}.json`, JSON.stringify({ format: 'daymark-journal-v1', exported_at: new Date().toISOString(), entries: state.entries }, null, 2), 'application/json');
    toast('Your journal JSON has been downloaded.', 'success');
  }
  function exportJournalPdf() {
    const entries = readState().entries.slice().sort((a, b) => b.date.localeCompare(a.date));
    const popup = window.open('', '_blank');
    if (!popup) { toast('Allow pop-ups for Daymark to print your journal as a PDF.', 'error'); return; }
    const rows = entries.map(item => `<article><h2>${safe(new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date(`${item.date}T12:00:00`)))}</h2><p>${safe(item.text).replace(/\n/g, '<br>')}</p><small>Mood: ${safe(item.mood || '🙂 Okay')}</small></article>`).join('') || '<p>No journal entries to export yet.</p>';
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Daymark journal</title><style>body{font:15px/1.6 Arial,sans-serif;max-width:760px;margin:40px auto;color:#24372a}h1{font-size:27px}article{padding:18px 0;border-bottom:1px solid #ddd;break-inside:avoid}h2{font-size:17px}small{color:#667}</style></head><body><h1>Daymark journal</h1>${rows}<script>window.onload=()=>window.print()<\/script></body></html>`);
    popup.document.close();
  }
  function clearData() { try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(THEME_KEY); return true; } catch { toast('The browser could not clear Daymark’s saved data.', 'error'); return false; } }
  async function importBackup(file) {
    const backup = JSON.parse(await file.text());
    if (backup.format !== 'daymark-browser-backup-v1' || !Array.isArray(backup.tasks) || !Array.isArray(backup.entries) || !backup.preferences || typeof backup.preferences !== 'object') throw new Error('That file is not a Daymark backup. Choose a JSON backup downloaded from Profile.');
    writeState({ user: backup.user && typeof backup.user === 'object' ? backup.user : defaults().user, tasks: backup.tasks, entries: backup.entries, preferences: { ...defaults().preferences, ...backup.preferences } });
  }
  function getTheme() { try { return localStorage.getItem(THEME_KEY) || 'light'; } catch { return 'light'; } }
  function setTheme(theme) { try { localStorage.setItem(THEME_KEY, theme); } catch { /* Theme still applies until this page closes. */ } }
  window.Daymark = { api, toast, todayKey, formatTime, safe, exportBackup, exportJournalJson, exportJournalPdf, importBackup, clearData, getTheme, setTheme };
})();
