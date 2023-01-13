import * as core from '@minepress/core';
(async () => {
  let client = new core.Client({
    host: 'localhost',
    port: 25565,
    account: {
      type: 'offline',
    },
  });
  await client.connect();
})();
