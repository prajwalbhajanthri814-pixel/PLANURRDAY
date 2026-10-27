(() => {
  const $ = selector => document.querySelector(selector), safe = window.Daymark.safe;
  let selectedDate = new Date(); selectedDate.setHours(12, 0, 0, 0); let calendarView = 'day', saveTimer = null;
  const key = date => window.Daymark.todayKey(date), shift = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
  const monday = date => { const start = new Date(date); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); return start; };
  const dateText = (date, options = { weekday: 'long', month: 'long', day: 'numeric' }) => new Intl.DateTimeFormat(undefined, options).format(date);
  const categoryColors = { Study: '#a99bdd', Portfolio: '#84ab82', Personal: '#e5b279', Wellbeing: '#e3977d', Physical: '#e3977d', Other: '#80afb2' };
  const color = name => categoryColors[name] || '#8aa48c';
  function dayTasks(tasks, date) { return tasks.filter(task => task.date === key(date)).sort((a, b) => a.time.localeCompare(b.time)); }
  function specials(tasks) { return tasks.filter(task => task.type === 'holiday' || task.type === 'birthday'); }
  function dateSpecials(tasks, date) { return specials(tasks).filter(task => task.date === key(date)); }
  function drawDateMarks(tasks, date) {
    const marks = dateSpecials(tasks, date).map(task => task.type === 'birthday' ? `🎂 ${task.birthdayName || task.title}` : `☼ ${task.eventName || task.title}`);
    if (date.getDay() === 0) marks.unshift('Sunday');
    return marks;
  }
  function dateBadge(task) { return task.type === 'birthday' ? `🎂 ${safe(task.birthdayName || task.title)}${task.wished ? ' · wished' : ''}` : `☼ ${safe(task.eventName || task.title)}`; }
  function drawDay(panel, tasks) {
    const items = dayTasks(tasks, selectedDate), marks = drawDateMarks(tasks, selectedDate);
    panel.innerHTML = `<div class="calendar-topline"><strong>IMPORTANT DATES</strong><span>${marks.map(safe).join(' · ') || 'Sunday · Holidays · Birthdays'}</span></div><div class="calendar-topline"><strong>${safe(dateText(selectedDate))}</strong><span>${items.length} ${items.length === 1 ? 'plan' : 'plans'}</span></div><div class="day-hours"><div class="hour-labels">${Array.from({length:12},(_,i)=>`<span class="hour-label">${((i+7) < 12 ? i+7 : (i+7)===12 ? 12 : (i+7)-12)}${i+7<12?' AM':' PM'}</span>`).join('')}</div><div class="day-time-grid">${items.map(task=>{const [hour,minute]=task.time.split(':').map(Number);const top=((hour-7)*60+minute)/2;const height=Math.max(28,Number(task.duration)||30);return `<article class="calendar-event ${String(task.category||'').toLowerCase()}" style="top:${Math.max(0,top)}px;height:${Math.min(90,height)}px"><strong>${safe(task.title)}</strong><span>${safe(window.Daymark.formatTime(task.time))}${task.type==='holiday'||task.type==='birthday'?` · ${dateBadge(task)}`:''}</span></article>`}).join('')}</div></div>`;
  }
  function drawWeek(panel, tasks) {
    const start = monday(selectedDate), days = Array.from({length:7},(_,i)=>shift(start,i));
    panel.innerHTML = `<div class="calendar-topline"><strong>IMPORTANT DATES</strong><span>Sundays · your holidays · birthdays</span></div><div class="calendar-topline"><strong>${safe(dateText(start,{month:'short',day:'numeric'}))} – ${safe(dateText(days[6],{month:'short',day:'numeric'}))}</strong><span>Select a day to see its plans</span></div><div class="week-calendar">${days.map(day=>{const items=dayTasks(tasks,day),marks=drawDateMarks(tasks,day);return `<button type="button" class="week-day${key(day)===key(selectedDate)?' selected':''}${day.getDay()===0?' sunday':''}${key(day)===key(new Date())?' today':''}" data-select-date="${key(day)}"><span class="week-day-head"><small>${safe(dateText(day,{weekday:'short'}))}${day.getDay()===0?' · Sunday':''}</small><strong>${day.getDate()}</strong></span><div class="week-chip-list">${marks.filter(mark=>mark!=='Sunday').map(mark=>`<i class="week-chip">${safe(mark)}</i>`).join('')}${items.slice(0,3).map(task=>`<i class="week-chip" style="--event-color:${color(task.category)}">${safe(window.Daymark.formatTime(task.time))} ${safe(task.title)}</i>`).join('')}${items.length>3?`<small class="week-more">+${items.length-3} more</small>`:''}</div></button>`}).join('')}</div>`;
  }
  function drawMonth(panel, tasks) {
    const first = new Date(selectedDate.getFullYear(),selectedDate.getMonth(),1,12), start = monday(first), days=Array.from({length:42},(_,i)=>shift(start,i));
    panel.innerHTML = `<div class="calendar-topline"><strong>IMPORTANT DATES</strong><span>Sundays · your holidays · birthdays</span></div><div class="calendar-topline"><strong>${safe(dateText(selectedDate,{month:'long',year:'numeric'}))}</strong><span>Select a date to see its plans</span></div><div class="month-calendar">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`<span class="month-weekday">${day}</span>`).join('')}${days.map(day=>{const items=dayTasks(tasks,day),marks=drawDateMarks(tasks,day);return `<button type="button" class="month-day${day.getMonth()!==selectedDate.getMonth()?' outside':''}${key(day)===key(selectedDate)?' selected':''}${key(day)===key(new Date())?' today':''}${day.getDay()===0?' sunday':''}" data-select-date="${key(day)}" aria-label="${safe(dateText(day))}${marks.length?`, ${safe(marks.join(', '))}`:''}"><strong>${day.getDate()}</strong><span class="month-dots">${marks.map(mark=>`<i title="${safe(mark)}">${mark==='Sunday'?'•':mark.startsWith('🎂')?'🎂':'☼'}</i>`).join('')}${items.slice(0,2).map(task=>`<i title="${safe(task.title)}">·</i>`).join('')}</span></button>`}).join('')}</div>`;
  }
  function renderImportantDates(tasks) {
    const root = $('[data-important-dates]'); if (!root) return;
    const today = new Date(); today.setHours(12,0,0,0); const end = shift(today,35), items=[];
    for(let date=new Date(today);date<=end;date=shift(date,1)) if(date.getDay()===0) items.push({date:new Date(date),type:'Sunday',label:'Sunday'});
    specials(tasks).filter(task=>task.date>=key(today)&&task.date<=key(end)).forEach(task=>items.push({date:new Date(`${task.date}T12:00:00`),type:task.type,label:task.type==='birthday'?`🎂 ${task.birthdayName||task.title}${task.wished?' · wished':''}`:`☼ ${task.eventName||task.title}`}));
    items.sort((a,b)=>a.date-b.date); root.innerHTML=items.slice(0,12).map(item=>`<div class="important-date"><time>${safe(dateText(item.date,{weekday:'short',month:'short',day:'numeric'}))}</time><span>${safe(item.label)}</span></div>`).join('')||'<p class="journal-empty">Add a holiday or birthday to keep it in view.</p>';
  }
  function renderPlanner(tasks) {
    const title=$('[data-planner-title]'), panel=$('[data-calendar-panel]'); if(!title||!panel)return;
    const start=monday(selectedDate), selectedKey=key(selectedDate);
    const visible=calendarView==='day'?dayTasks(tasks,selectedDate):calendarView==='week'?tasks.filter(task=>task.date>=key(start)&&task.date<=key(shift(start,6))):tasks.filter(task=>task.date.startsWith(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}`));
    title.textContent=calendarView==='day'?dateText(selectedDate):calendarView==='week'?`Week of ${dateText(start,{month:'short',day:'numeric'})}`:dateText(selectedDate,{month:'long',year:'numeric'});
    const listTitle=$('[data-plan-list-title]'); if(listTitle)listTitle.textContent=calendarView==='day'?`${dateText(selectedDate,{weekday:'long'})}’s plans`:calendarView==='week'?'Plans this week':'Plans this month';
    $('[data-plan-count]').textContent=`${visible.length} ${visible.length===1?'plan':'plans'}`;
    $('[data-planner-tasks]').innerHTML=visible.slice().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).map(task=>window.DaymarkApp.taskMarkup(task,true)).join('');
    $('[data-planner-empty]').hidden=visible.length>0;
    if(calendarView==='day')drawDay(panel,tasks);else if(calendarView==='week')drawWeek(panel,tasks);else drawMonth(panel,tasks);
    renderImportantDates(tasks);
    document.querySelectorAll('[data-calendar-view]').forEach(button=>{const active=button.dataset.calendarView===calendarView;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('[data-date-shift]').forEach(button=>button.setAttribute('aria-label',`${button.dataset.dateShift==='-1'?'Previous':'Next'} ${calendarView}`));
    const selected=$('[data-selected-date]');if(selected)selected.textContent=dateText(selectedDate);
  }
  function renderInsights(tasks, preferences) {
    const root=$('[data-week-chart]'); if(!root)return;
    const start=monday(new Date()),days=Array.from({length:7},(_,i)=>shift(start,i)),counts=days.map(day=>tasks.filter(task=>task.date===key(day)&&task.done).length),max=Math.max(1,...counts);
    const completed=tasks.filter(task=>task.done&&task.date>=key(start)&&task.date<=key(shift(start,6))), weekTasks=tasks.filter(task=>task.date>=key(start)&&task.date<=key(shift(start,6)));
    $('[data-insight-period]').textContent=`WEEK OF ${dateText(start,{month:'short',day:'numeric'}).toUpperCase()}`;
    $('[data-summary-done]').textContent=String(completed.length);$('[data-summary-minutes]').textContent=`${completed.reduce((total,task)=>total+Number(task.duration||0),0)} min`;
    const windows={morning:'Earlier day',midday:'Midday',evening:'Later day',flexible:'Flexible'};$('[data-summary-focus]').textContent=windows[preferences.focus_window]||'Flexible';
    root.innerHTML=days.map((day,i)=>`<div class="large-bar-day${key(day)===key(new Date())?' today':''}" title="${safe(dateText(day,{weekday:'long'}))}: ${counts[i]} completed"><strong class="large-bar-value">${counts[i]||'·'}</strong><span class="large-bar-track"><i class="large-bar-fill" style="height:${counts[i]?Math.max(7,counts[i]/max*100):3}%"></i></span><small>${safe(dateText(day,{weekday:'short'}))}</small></div>`).join('');
    const totals=new Map();weekTasks.forEach(task=>totals.set(task.category||'Other',(totals.get(task.category||'Other')||0)+1));const total=[...totals.values()].reduce((sum,value)=>sum+value,0);let degree=0;
    const palette=['#a99bdd','#84ab82','#e5b279','#e3977d','#80afb2','#cf9dab','#90a9cf'];const slices=[...totals.entries()].map(([name,count],i)=>{const from=degree;degree+=count/(total||1)*360;return `${palette[i%palette.length]} ${from}deg ${degree}deg`;});
    $('[data-pie-total]').textContent=String(total);$('[data-category-pie]').style.background=slices.length?`conic-gradient(${slices.join(',')})`:'';
    $('[data-pie-legend]').innerHTML=[...totals.entries()].map(([name,count],i)=>`<div class="pie-legend-item"><i style="background:${palette[i%palette.length]}"></i><span>${safe(name)}</span><strong>${Math.round(count/(total||1)*100)}%</strong></div>`).join('')||'<p class="journal-empty">Your task areas will appear here.</p>';
    const grid=$('[data-consistency-grid]');if(grid){const days28=Array.from({length:28},(_,i)=>shift(new Date(),i-27));grid.innerHTML=days28.map(day=>{const count=tasks.filter(task=>task.date===key(day)&&task.done).length;return `<span class="consistency-dot level-${Math.min(4,count)}" title="${safe(dateText(day))}: ${count} completed" aria-label="${safe(dateText(day))}: ${count} completed"></span>`}).join('');}
    const moodCount=$('[data-summary-mood]');if(moodCount)moodCount.textContent=String(journalCountForWeek());
  }
  function journalCountForWeek(){const today=new Date(),start=monday(today),entries=window.DaymarkApp?.journal||[];return entries.filter(entry=>entry.date>=key(start)&&entry.date<=key(shift(start,6))).length;}
  function renderJournal(entries) {
    const today=key(new Date()), current=entries.find(entry=>entry.date===today),form=$('[data-journal-form]');if(!form)return;
    $('[data-journal-date]').textContent=dateText(new Date());form.elements.text.value=current?.text||'';
    const mood=current?.mood||'';form.elements.mood.value=mood;
    document.querySelectorAll('[data-mood]').forEach(button=>{const active=button.dataset.mood===mood;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
    const status=$('[data-journal-status]');if(status)status.textContent=current?'All changes saved to this device':'Your check-in saves automatically';
    const older=entries.filter(entry=>entry.date!==today).sort((a,b)=>b.date.localeCompare(a.date));
    $('[data-journal-history]').innerHTML=older.slice(0,20).map(entry=>`<article class="journal-entry"><time datetime="${safe(entry.date)}">${safe(dateText(new Date(`${entry.date}T12:00:00`),{weekday:'short',month:'short',day:'numeric',year:'numeric'}))}</time><p>${safe(entry.text).replace(/\n/g,'<br>')}</p><small class="journal-energy">${safe(entry.mood||'Reflection')}</small></article>`).join('');
    $('[data-journal-empty]').hidden=older.length>0;
  }
  function setSaveStatus(message){const status=$('[data-journal-status]');if(status)status.textContent=message;}
  async function saveCurrentJournal(showToast=false){const form=$('[data-journal-form]');if(!form)return;const text=form.elements.text.value.trim(),mood=form.elements.mood.value;if(!text&&!mood){setSaveStatus('Add a thought or choose a mood to save');return;}
    const entry={date:key(new Date()),text,mood,energy:mood};const entries=[entry,...window.DaymarkApp.journal.filter(item=>item.date!==entry.date)];setSaveStatus('Saving…');
    try{await window.Daymark.api('/api/journal',{method:'PUT',body:{entries:[entry]}});window.DaymarkApp.setJournal(entries);renderJournal(entries);if(showToast)window.Daymark.toast('Your check-in is saved on this device.','success');}
    catch(problem){setSaveStatus('Could not save');window.Daymark.toast(problem.message,'error');}}
  function renderProfile(user,preferences){const form=$('[data-profile-form]');if(!form)return;form.elements.name.value=user.name||'Friend';$('[data-profile-heading]').textContent=user.name||'Friend';const pref=$('[data-preferences-form]');pref.elements.focus_window.value=preferences.focus_window||'flexible';pref.elements.wake_time.value=preferences.wake_time||'';pref.elements.bed_time.value=preferences.bed_time||'';const theme=$('[data-current-theme]');if(theme)theme.textContent=document.body.dataset.theme==='dark'?'Dark appearance':'Light appearance';}
  function render(page,state){if(page==='planner')renderPlanner(state.tasks);if(page==='insights')renderInsights(state.tasks,state.preferences);if(page==='journal')renderJournal(state.journal);if(page==='profile')renderProfile(state.user,state.preferences);}
  document.addEventListener('click',event=>{
    const view=event.target.closest('[data-calendar-view]');if(view){calendarView=view.dataset.calendarView;renderPlanner(window.DaymarkApp.tasks);}
    const change=event.target.closest('[data-date-shift]');if(change){const amount=Number(change.dataset.dateShift);if(calendarView==='day')selectedDate=shift(selectedDate,amount);else if(calendarView==='week')selectedDate=shift(selectedDate,amount*7);else{selectedDate=new Date(selectedDate);selectedDate.setMonth(selectedDate.getMonth()+amount);}renderPlanner(window.DaymarkApp.tasks);}
    if(event.target.closest('[data-jump-today]')){selectedDate=new Date();selectedDate.setHours(12,0,0,0);calendarView='day';renderPlanner(window.DaymarkApp.tasks);}
    const pick=event.target.closest('[data-select-date]');if(pick){selectedDate=new Date(`${pick.dataset.selectDate}T12:00:00`);calendarView='day';renderPlanner(window.DaymarkApp.tasks);}
    const mood=event.target.closest('[data-mood]');if(mood){const form=$('[data-journal-form]');form.elements.mood.value=mood.dataset.mood;document.querySelectorAll('[data-mood]').forEach(button=>{const active=button===mood;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});setSaveStatus('Saving…');clearTimeout(saveTimer);saveTimer=window.setTimeout(()=>saveCurrentJournal(),280);}
    if(event.target.closest('[data-shuffle-prompt]')){const prompts=['What felt easier than you expected?','What is one small thing you are proud of?','What would make tomorrow feel a little lighter?','When did you feel most like yourself today?','What can you let go of for tonight?','What did you learn about your energy today?'];const prompt=$('[data-prompt-text]');if(prompt){let next=prompts[Math.floor(Math.random()*prompts.length)];if(next===prompt.textContent)next=prompts[(prompts.indexOf(next)+1)%prompts.length];prompt.textContent=next;}}
  });
  $('[data-journal-form]')?.addEventListener('input',event=>{if(event.target.matches('textarea')){setSaveStatus('Saving…');clearTimeout(saveTimer);saveTimer=window.setTimeout(()=>saveCurrentJournal(),500);}});
  $('[data-journal-form]')?.addEventListener('submit',event=>{event.preventDefault();clearTimeout(saveTimer);saveCurrentJournal(true);});
  $('[data-journal-text]')?.addEventListener('keydown',event=>{if(event.ctrlKey&&event.key==='Enter'){event.preventDefault();$('[data-journal-form]').requestSubmit();}});
  $('[data-profile-form]')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,error=$('[data-profile-error]');try{const result=await window.Daymark.api('/api/profile',{method:'PUT',body:{name:form.elements.name.value}});window.DaymarkApp.setUser(result.user);window.Daymark.toast('Your name is saved on this device.','success');}catch(problem){if(error){error.hidden=false;error.textContent=problem.message;}}});
  $('[data-preferences-form]')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,error=$('[data-preferences-error]');try{const result=await window.Daymark.api('/api/preferences',{method:'PUT',body:{preferences:{focus_window:form.elements.focus_window.value,wake_time:form.elements.wake_time.value,bed_time:form.elements.bed_time.value}}});window.DaymarkApp.setPreferences(result.preferences);window.Daymark.toast('Your preferences are saved on this device.','success');}catch(problem){error.hidden=false;error.textContent=problem.message;}});
  window.addEventListener('pagehide', () => { clearTimeout(saveTimer); const form = $('[data-journal-form]'); if (form && (form.elements.text.value.trim() || form.elements.mood.value)) saveCurrentJournal(); });
  window.DaymarkPages={render,get selectedDateKey(){return key(selectedDate);}};
})();
