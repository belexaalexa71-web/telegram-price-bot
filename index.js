const { startBot } = require('./src/bot');

startBot().catch((error) => {
  console.error('Fatal startup error:', error);
  process.exit(1);
});
