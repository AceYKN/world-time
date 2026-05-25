import { createServer } from 'node:net';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const LOCAL_HOST = '127.0.0.1';
const DEV_PORT_CANDIDATES = [4173, 4174, 4175, 3000, 3001, 3002];
const PREVIEW_PORT_CANDIDATES = [4174, 4175, 4176, 3001, 3002, 3003];

function canListenOnPort(port, host) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function pickAvailablePort(candidates, host) {
  for (const port of candidates) {
    if (await canListenOnPort(port, host)) {
      return port;
    }
  }

  throw new Error(`No usable local port found for ${host}`);
}

export default defineConfig(async ({ command }) => {
  const port = await pickAvailablePort(
    command === 'serve' ? DEV_PORT_CANDIDATES : PREVIEW_PORT_CANDIDATES,
    LOCAL_HOST,
  );

  return {
    base: '/world-time/',
    plugins: [react()],
    server: {
      host: LOCAL_HOST,
      port,
    },
    preview: {
      host: LOCAL_HOST,
      port,
    },
  };
});
