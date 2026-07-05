export const nav = {
  main(isOwner = false) {
    const rows = [
      [{ text: '📊 Market', callback_data: 'market' }, { text: '🌍 Community', callback_data: 'community' }],
      [{ text: '📚 Project', callback_data: 'project' }, { text: '❓ Help', callback_data: 'help' }],
    ];
    if (isOwner) rows.push([{ text: '🔒 Control Center', callback_data: 'admin' }]);
    rows.push([{ text: '❌ Close', callback_data: 'close' }]);
    return { inline_keyboard: rows };
  },
  market() { return { inline_keyboard: [
    [{ text: '💰 Price', callback_data: 'price' }, { text: '📈 Chart', callback_data: 'chart' }],
    [{ text: '🛒 Buy', callback_data: 'buy' }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]}; },
  community(websiteUrl, xUrl) { return { inline_keyboard: [
    [{ text: '🌐 Website', url: websiteUrl }],
    [{ text: '🐦 X', url: xUrl }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]}; },
  project() { return { inline_keyboard: [
    [{ text: '📢 News', callback_data: 'news' }, { text: '🗺 Roadmap', callback_data: 'roadmap' }],
    [{ text: '💎 Tokenomics', callback_data: 'tokenomics' }, { text: '❓ FAQ', callback_data: 'faq' }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]}; },
  admin() { return { inline_keyboard: [
    [{ text: '🟢 Status', callback_data: 'admin_status' }, { text: '🔗 Links', callback_data: 'admin_links' }],
    [{ text: '📢 News', callback_data: 'admin_news' }, { text: '🗺 Roadmap', callback_data: 'admin_roadmap' }],
    [{ text: '💎 Tokenomics', callback_data: 'admin_tokenomics' }, { text: '❓ FAQ', callback_data: 'admin_faq' }],
    [{ text: '📊 Stats', callback_data: 'admin_stats' }, { text: '📜 Logs', callback_data: 'admin_logs' }],
    [{ text: '⬅ Back', callback_data: 'home' }, { text: '❌ Close', callback_data: 'close' }]
  ]}; },
  backAdmin() { return { inline_keyboard: [[{ text: '⬅ Control Center', callback_data: 'admin' }, { text: '❌ Close', callback_data: 'close' }]]}; },
  status() { return { inline_keyboard: [
    [{ text: '🟢 Building', callback_data: 'set_status:Building' }],
    [{ text: '🟡 Presale', callback_data: 'set_status:Presale' }],
    [{ text: '🚀 Live', callback_data: 'set_status:Live' }],
    [{ text: '⬅ Control Center', callback_data: 'admin' }]
  ]}; }
};
