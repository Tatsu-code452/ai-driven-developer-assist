import { createApp } from './app.ts';
import { loadConfig } from './config.ts';

const cfg = loadConfig();
const { server } = createApp(cfg);
server.listen(cfg.port, () => {
  console.log(`API server listening on http://localhost:${cfg.port}`);
  console.log(`  data: ${cfg.dataDir}`);
  console.log(`  git workspace: ${cfg.workspaceRoot}`);
  if (!cfg.apiToken) console.warn('  API_TOKEN が未設定のため、認証なしで公開されます。ローカル開発以外では設定してください。');
});
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => server.close(() => process.exit(0)));
