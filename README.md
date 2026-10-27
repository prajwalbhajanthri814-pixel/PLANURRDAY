# Daymark — personal planner

Daymark is a calm, responsive planner for daily tasks, reminders, special dates, reflections, and progress insights. The public welcome page links straight into the app. No sign-in or Python server is needed.

## Pages

- `index.html` — introduction, saving details, planning tips, and the **Start planning** button
- `dashboard.html` — today’s tasks, weekly progress, and today’s journal check-in
- `planner.html` — day, week, and month views; Sunday markers; user-added holidays and birthdays; inline task completion
- `insights.html` — weekly completed-task bar chart, task-area pie chart, and a gentle 28-day consistency grid
- `journal.html` — one-tap mood check-in, rotating prompts, automatic save status, and `Ctrl + Enter` save shortcut
- `profile.html` — name and planning preferences, light/dark appearance, full backup and restore, journal JSON export, and print-to-PDF

## Run or publish

Upload the contents of this folder to a static website host, with `index.html` as its home page. GitHub Pages and other static hosts can serve it. Open the published HTTPS address and choose **Start planning**. Keep the files together so page links, styles, and artwork resolve.

The planner saves tasks, completion history, special dates, profile name, preferences, and journal entries automatically in this browser on this device. They remain when you leave and return using the same browser and website address. They do not sync to other browsers or devices. Clearing browser site data can erase them. Use **Profile → Download full backup** to preserve everything; **Restore backup** loads a downloaded Daymark backup.

Journal text and plans use local browser storage and are not encrypted by this app. Avoid putting highly sensitive information in the journal. The PDF journal export opens a print view; choose **Save as PDF** in the browser’s print dialog.

## Reminders and suggestions

In-app reminders run while a Daymark page is open. Browser notifications require HTTPS, browser support, and permission. This static edition cannot guarantee reminders after the browser is closed or in the background. Suggestions use the preferences and completed-task patterns you choose; they do not vary by gender and are not medical or scientific advice.

## Credit

Created by Prajwal with development assistance from OpenAI Codex.