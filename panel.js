import { nav } from '../keyboards/navigation.js';
import { store } from '../database/store.js';

export function adminPanelText() {
  return `🔒 TRINTOPE Control Center\n\nWelcome back, Owner.\n\nManage content, project settings, analytics and system tools from one place.\n\nVersion: 0.1.1`;
}

export function adminStatusText() {
  return `🟢 Project Status\n\nCurrent: ${store.getSetting('status')}\n\nChoose the new public project status.`;
}

export function adminLinksText() {
  return `🔗 Official Links\n\nWebsite:\n${store.getSetting('websiteUrl')}\n\nX:\n${store.getSetting('xUrl')}\n\nTo edit, send:\n/set_website URL\n/set_x URL`;
}

export function adminStatsText() {
  const s = store.stats();
  return `📊 Analytics\n\nUsers: ${s.users}\nLogs: ${s.logs}\nStatus: ${s.status}`;
}

export function adminLogsText() {
  const logs = store.logs()
    .map(l => `${l.at.slice(0,16).replace('T',' ')} — ${l.action}`)
    .join('\n') || 'No logs yet.';
  return `📜 Action Logs\n\n${logs}`;
}

export function adminEditHint(section, command) {
  return `${section}\n\nTo edit, send:\n${command} your text`;
}

export function setStatus(ctx, status) {
  store.setSetting('status', status);
  store.log(ctx.from.id, `Status changed to ${status}`);
  return `✅ Status updated: ${status}`;
}
