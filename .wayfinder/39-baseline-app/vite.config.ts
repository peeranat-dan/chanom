import { createViteConfig } from '@chanom/vite-config';
import react from '@vitejs/plugin-react';

export default createViteConfig({ plugins: [react()] });
