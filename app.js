(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const page = document.body.dataset.page;
  let user = { name: 'Friend' }, tasks = [], journal = [];
  let preferences = { focus_window: 'flexible', wake_time: '', bed_time: '' }, editingId = null;
  const notified = new Set();
  const categoryColors = { study: '#a99bdd', portfolio: '#84ab82', personal: '#e5b279', wellbeing: '#e3977d', physical: '#e3977d', other: '#80afb2' };
  const fmtDate = (date, options = { weekday: 'long', month: 'long', day: 'numeric' }) => new Intl.DateTimeFormat(undefined, options).format(date);
  const shift = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
  const monday = date => { const start = new Date(date); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); return start; };
  const taskAt = task => new Date(`${task.date}T${task.time}:00`);
  const saveTasks = () => window.Daymark.api('/api/tasks', { method: 'PUT', body: { tasks } });
  const escape = value => window.Daymark.safe(value);
  const categoryClass = value => String(value || 'other').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  function categoryColor(value) { return categoryColors[categoryClass(value)] || '#8aa48c'; }
  function setTheme(theme) {
    document.body.dataset.theme = theme;
    window.Daymark.setTheme(theme);
    $$('[data-theme-toggle]').forEach(button => {
      button.textContent = theme === 'dark' ? '☼' : '☾';
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`);
      button.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} appearance`;
      document.querySelectorAll('[data-current-theme]').forEach(el => el.textContent = theme === 'dark' ? 'Dark appearance' : 'Light appearance');
    });
  }
  function renderCommon() {
    $$('[data-profile-name]').forEach(el => el.textContent = user?.name || 'Friend');
    $$('[data-profile-initial]').forEach(el => el.textContent = (user?.name || 'F').trim().charAt(0).toUpperCase());
    $$('[data-today-date]').forEach(el => el.textContent = fmtDate(new Date(), { month: 'short', day: 'numeric', year: 'numeric' }));
  }
  function taskMarkup(task, planner = false) {
    const special = task.type === 'birthday' ? `<span class="special-tag">🎂 ${escape(task.birthdayName || 'Birthday')}${task.wished ? ' · wished' : ''}</span>` : task.type === 'holiday' ? `<span class="special-tag holiday-tag">☼ ${escape(task.eventName || 'Holiday')}</span>` : '';
    const rowClass = `${planner ? 'planner-task' : 'task-row'}${task.done ? ' completed done' : ''}`;
    return `<article class="${rowClass}" data-task-id="${escape(task.id)}"><button type="button" class="task-check${task.done ? ' checked' : ''}" data-task-action="toggle" aria-label="${task.done ? 'Mark incomplete' : 'Mark complete'}: ${escape(task.title)}" aria-pressed="${Boolean(task.done)}">${task.done ? '✓' : ''}</button><div class="${planner ? 'planner-task-main' : 'task-details'}"><div class="${planner ? 'planner-task-time' : 'task-time'}">${escape(window.Daymark.formatTime(task.time))}${planner ? '' : ''}</div><strong class="${planner ? 'planner-task-title' : 'task-title'}">${escape(task.title)}</strong><div class="task-meta"><span class="category-tag ${categoryClass(task.category)}">${escape(task.category || 'Other')}</span><span class="task-duration">${Number(task.duration) || 30} min</span>${task.reminder ? '<span title="Reminder set" aria-label="Reminder set">♧</span>' : ''}${special}</div></div><span class="task-status${task.done ? ' done' : ''}">${task.done ? 'Done' : ''}</span><div class="task-actions"><button type="button" class="tiny-action" data-task-action="edit" aria-label="Edit ${escape(task.title)}" title="Edit">✎</button>${task.type === 'birthday' ? `<button type="button" class="tiny-action" data-task-action="wish" aria-label="${task.wished ? 'Mark birthday as not wished' : 'Mark birthday as wished'}" title="${task.wished ? 'Wished' : 'Mark wished'}">${task.wished ? '💌' : '♡'}</button>` : ''}<button type="button" class="tiny-action" data-task-action="delete" aria-label="Delete ${escape(task.title)}" title="Delete">×</button></div></article>`;
  }
  function renderDashboard() {
    const today = window.Daymark.todayKey();
    const todays = tasks.filter(task => task.date === today).sort((a, b) => a.time.localeCompare(b.time));
    const completed = todays.filter(task => task.done).length, pending = todays.length - completed;
    const greeting = $('[data-greeting]');
    if (!greeting) return;
    const hour = new Date().getHours();
    greeting.textContent = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, ${(user.name || 'Friend').split(' ')[0]}.`;
    $('[data-welcome-title]').textContent = pending ? 'Every small step counts.' : todays.length ? 'You made room for your day.' : 'Every day starts somewhere.';
    $('[data-progress-caption]').textContent = pending ? `${pending} planned ${pending === 1 ? 'task is' : 'tasks are'} still ahead. Take them at your pace.` : todays.length ? 'Your plan is complete. Let the rest of the day be yours.' : 'Add one small thing you would like to make room for.';
    $('[data-done-count]').textContent = String(completed); $('[data-total-count]').textContent = String(todays.length);
    $('[data-task-count]').textContent = `${todays.length} ${todays.length === 1 ? 'task' : 'tasks'}`;
    const percent = todays.length ? Math.round(completed / todays.length * 100) : 0;
    $('[data-progress-number]').textContent = `${percent}%`; $('[data-progress-ring]').style.setProperty('--progress', `${percent}%`);
    $('[data-today-tasks]').innerHTML = todays.map(task => taskMarkup(task)).join(''); $('[data-empty-today]').hidden = todays.length > 0;
    const reflection = journal.find(entry => entry.date === today);
    const reflectionText = $('[data-today-reflection-text]');
    if (reflectionText) reflectionText.textContent = reflection?.text || 'A few words about today can be enough. Your check-in stays in this browser.';
    const reflectionMood = $('[data-today-reflection-mood]'); if (reflectionMood) reflectionMood.textContent = reflection?.mood || '';
    renderMiniBars(); renderSuggestion();
  }
  function renderMiniBars() {
    const root = $('[data-mini-bars]'); if (!root) return;
    const start = monday(new Date()), days = Array.from({ length: 7 }, (_, index) => shift(start, index));
    const counts = days.map(date => tasks.filter(task => task.date === window.Daymark.todayKey(date) && task.done).length), max = Math.max(1, ...counts);
    root.innerHTML = days.map((date, i) => `<div class="bar-item${window.Daymark.todayKey(date) === window.Daymark.todayKey() ? ' today' : ''}" title="${escape(fmtDate(date, { weekday: 'long' }))}: ${counts[i]} completed"><span class="bar-value">${counts[i] || '·'}</span><span class="bar-pair"><i class="bar-track"><i class="bar-fill" style="height:${Math.max(counts[i] ? 10 : 3, counts[i] / max * 100)}%"></i></i></span><small class="bar-day">${escape(fmtDate(date, { weekday: 'narrow' }))}</small></div>`).join('');
  }
  function renderSuggestion() {
    const title = $('[data-suggestion-title]'); if (!title) return;
    const copy = $('[data-suggestion-copy]'), selected = preferences.focus_window;
    const labels = { morning: 'Earlier in the day', midday: 'Around midday', evening: 'Later in the day' };
    if (labels[selected]) { title.textContent = `${labels[selected]} feels right to you.`; copy.textContent = 'You chose this focus window. Try placing one important task there and adjust whenever your routine changes.'; return; }
    const byHour = new Map(); tasks.filter(task => task.done).forEach(task => { const hour = Number(task.time.slice(0, 2)); byHour.set(hour, (byHour.get(hour) || 0) + 1); });
    if ([...byHour.values()].reduce((sum, n) => sum + n, 0) >= 3) { const hour = [...byHour.entries()].sort((a, b) => b[1] - a[1])[0][0], band = hour < 12 ? 'earlier in the day' : hour < 17 ? 'around midday' : 'later in the day'; title.textContent = `Your history leans ${band}.`; copy.textContent = `You have completed the most tasks ${band}. That is a pattern from your own history, not a rule.`; }
    else { title.textContent = 'Find your own rhythm.'; copy.textContent = 'Choose the hours that tend to work for you. Daymark can learn from your preferences and completed tasks.'; }
  }
  function renderPage() {
    renderCommon();
    if (page === 'dashboard') renderDashboard();
    if (window.DaymarkPages) window.DaymarkPages.render(page, { tasks, journal, preferences, user });
  }
  function parseTime(form) {
    let hour = Number(form.elements.hour.value), minute = Number(form.elements.minute.value), period = form.elements.period.value;
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) throw new Error('Choose a valid time.');
    if (period === 'AM') hour = hour === 12 ? 0 : hour; else hour = hour === 12 ? 12 : hour + 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  function setSpecialFields(kind, task = {}) {
    const birthday = $('#birthday-fields'), holiday = $('#holiday-fields');
    if (birthday) birthday.hidden = kind !== 'birthday'; if (holiday) holiday.hidden = kind !== 'holiday';
    const form = $('[data-task-form]'); if (!form) return;
    if (kind === 'birthday' && !form.elements.title.value.trim()) form.elements.title.value = task.birthdayName ? 'Wish ' + task.birthdayName + ' happy birthday' : 'Birthday wish';
    if (kind === 'holiday' && !form.elements.title.value.trim()) form.elements.title.value = task.eventName || 'Important day';
  }
  function timeParts(time) { const [rawHour, minute] = (time || '15:00').split(':').map(Number); return { hour: rawHour % 12 || 12, minute, period: rawHour < 12 ? 'AM' : 'PM' }; }
  function openTask(task = null) {
    const dialog = $('[data-task-dialog]'); if (!dialog) return;
    const form = dialog.querySelector('[data-task-form]'); form.reset();
    const date = $('#task-date'); date.value = task?.date || (page === 'planner' && window.DaymarkPages ? window.DaymarkPages.selectedDateKey : window.Daymark.todayKey());
    const parts = timeParts(task?.time || '15:00'); form.elements.hour.value = parts.hour; form.elements.minute.value = parts.minute; form.elements.period.value = parts.period;
    $('#task-title').value = task?.title || ''; $('#task-category').value = task?.category || 'Study'; $('#task-duration').value = String(task?.duration || 45);
    form.elements.reminder.checked = Boolean(task?.reminder); $('#task-kind').value = task?.type || 'task';
    $('#birthday-name').value = task?.birthdayName || ''; $('#birthday-wished').checked = Boolean(task?.wished); $('#holiday-name').value = task?.eventName || '';
    editingId = task?.id || null; $('#task-dialog-title').textContent = task ? 'Edit your plan' : 'Add to your day';
    const error = $('[data-task-error]'); error.hidden = true; setSpecialFields($('#task-kind').value, task || {}); dialog.showModal(); $('#task-title').focus();
  }
  function closeTask() { const dialog = $('[data-task-dialog]'); if (dialog?.open) dialog.close(); editingId = null; }
  async function submitTask(form) {
    const data = new FormData(form), kind = String(data.get('kind') || 'task'), specialName = String(data.get(kind === 'birthday' ? 'birthday_name' : 'holiday_name') || '').trim();
    const title = String(data.get('title') || '').trim() || (kind === 'birthday' && specialName ? `Wish ${specialName} happy birthday` : '');
    const error = $('[data-task-error]'); error.hidden = true;
    if (!title) { error.textContent = 'Add a task name first.'; error.hidden = false; return; }
    let time; try { time = parseTime(form); } catch(problem) { error.textContent = problem.message; error.hidden = false; return; }
    if (kind === 'birthday' && !specialName) { error.textContent = 'Add the person’s name for the birthday reminder.'; error.hidden = false; $('#birthday-name').focus(); return; }
    const task = { id: editingId || `task-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`, title, date: String(data.get('date')), time, category: String(data.get('category') || 'Other').trim().slice(0, 40), duration: Number(data.get('duration')) || 30, done: false, reminder: data.get('reminder') === 'on', completed_at: '', type: kind, birthdayName: kind === 'birthday' ? specialName : '', wished: kind === 'birthday' ? data.get('wished') === 'on' : false, eventName: kind === 'holiday' ? specialName : '' };
    if (task.reminder && taskAt(task).getTime() <= Date.now()) { error.textContent = 'Choose a future date and time for the reminder, or turn it off.'; error.hidden = false; return; }
    const previous = tasks, old = editingId ? tasks.find(item => item.id === editingId) : null;
    if (old) { task.done = old.done; task.completed_at = old.completed_at || ''; tasks = tasks.map(item => item.id === editingId ? task : item); } else tasks = [...tasks, task];
    try { await saveTasks(); closeTask(); renderPage(); window.Daymark.toast(old ? 'Your plan was updated.' : 'Your plan was saved on this device.', 'success'); if (task.reminder && !task.done) scheduleReminder(task); }
    catch(problem) { tasks = previous; error.textContent = problem.message; error.hidden = false; }
  }
  async function changeTask(id, action) {
    const current = tasks.find(task => task.id === id); if (!current) return;
    if (action === 'edit') { openTask(current); return; }
    if (action === 'delete' && !window.confirm(`Remove “${current.title}” from your plan?`)) return;
    const previous = tasks;
    if (action === 'toggle') tasks = tasks.map(task => task.id === id ? { ...task, done: !task.done, completed_at: !task.done ? new Date().toISOString() : '' } : task);
    if (action === 'wish') tasks = tasks.map(task => task.id === id ? { ...task, wished: !task.wished } : task);
    if (action === 'delete') tasks = tasks.filter(task => task.id !== id);
    try { await saveTasks(); renderPage(); if (action === 'toggle') window.Daymark.toast(tasks.find(task => task.id === id)?.done ? 'Nice work. One more thing you showed up for.' : 'Task moved back to your plan.', 'success'); if (action === 'wish') window.Daymark.toast('Birthday wish status updated.', 'success'); if (action === 'delete') window.Daymark.toast('Plan item removed.'); }
    catch(problem) { tasks = previous; renderPage(); window.Daymark.toast(problem.message, 'error'); }
  }
  function scheduleReminder(task) {
    if (!task.reminder || task.done) return;
    const delay = taskAt(task).getTime() - Date.now(); if (delay <= 0) return;
    window.setTimeout(() => { const latest = tasks.find(item => item.id === task.id); if (!latest || latest.done || !latest.reminder || notified.has(task.id)) return; if (taskAt(latest).getTime() > Date.now()) { scheduleReminder(latest); return; } notified.add(task.id); window.Daymark.toast(`A gentle nudge: ${latest.title}`, 'reminder'); if ('Notification' in window && Notification.permission === 'granted') new Notification('Daymark reminder', { body: latest.title, icon: './daymark-icon-192.png', tag: latest.id }); }, Math.min(delay, 2147480000));
  }
  async function enableNotifications() {
    if (!('Notification' in window)) { window.Daymark.toast('This browser does not support system notifications. In-app reminders still appear while Daymark is open.'); return; }
    try { const permission = await Notification.requestPermission(); if (permission === 'granted') window.Daymark.toast('System notifications are enabled for this browser.', 'success'); else window.Daymark.toast('Notifications are off. You can allow them in browser settings.'); }
    catch { window.Daymark.toast('Could not open notification settings.'); }
  }
  async function boot() {
    setTheme(window.Daymark.getTheme());
    try {
      const session = await window.Daymark.api('/api/auth/me'); user = session.user;
      const [taskData, journalData, prefData] = await Promise.all([window.Daymark.api('/api/tasks'), window.Daymark.api('/api/journal'), window.Daymark.api('/api/preferences')]);
      tasks = taskData.tasks || []; journal = journalData.entries || []; preferences = prefData.preferences || preferences; renderPage(); tasks.forEach(scheduleReminder);
      if (page === 'dashboard' && location.hash === '#today') document.getElementById('today')?.scrollIntoView();
    } catch(problem) { const banner = document.createElement('div'); banner.className = 'server-banner'; banner.setAttribute('role', 'alert'); banner.textContent = `Daymark could not load data saved in this browser: ${problem.message}`; document.body.prepend(banner); }
  }
  document.addEventListener('click', event => {
    const open = event.target.closest('[data-open-task]'); if (open) openTask();
    const close = event.target.closest('[data-close-task]'); if (close) closeTask();
    const action = event.target.closest('[data-task-action]'); if (action) { const row = action.closest('[data-task-id]'); if (row) changeTask(row.dataset.taskId, action.dataset.taskAction); }
    if (event.target.closest('[data-notification-button]')) enableNotifications();
    if (event.target.closest('[data-theme-toggle]')) setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
    if (event.target.closest('[data-export-data]')) window.Daymark.exportBackup();
    if (event.target.closest('[data-export-journal-json]')) window.Daymark.exportJournalJson();
    if (event.target.closest('[data-export-journal-pdf]')) window.Daymark.exportJournalPdf();
    if (event.target.closest('[data-clear-data]') && window.confirm('Clear every Daymark task, reflection, and preference saved in this browser? This cannot be undone.')) { if (window.Daymark.clearData()) location.assign('index.html'); }
  });
  document.addEventListener('change', async event => {
    const kind = event.target.closest('#task-kind'); if (kind) setSpecialFields(kind.value);
    const input = event.target.closest('[data-import-backup]'), file = input?.files?.[0]; if (!file) return;
    try { await window.Daymark.importBackup(file); window.Daymark.toast('Your backup has been restored.', 'success'); window.setTimeout(() => location.reload(), 500); }
    catch(problem) { window.Daymark.toast(problem.message || 'Daymark could not read that backup.', 'error'); input.value = ''; }
  });
  document.querySelectorAll('[data-task-form]').forEach(form => form.addEventListener('submit', event => { event.preventDefault(); submitTask(event.currentTarget); }));
  window.DaymarkApp = { get tasks() { return tasks; }, get journal() { return journal; }, get preferences() { return preferences; }, get user() { return user; }, setJournal(entries) { journal = entries; }, setPreferences(value) { preferences = value; renderPage(); }, setUser(value) { user = value; renderPage(); }, render: renderPage, refresh: renderPage, taskMarkup };
  boot();
})();
