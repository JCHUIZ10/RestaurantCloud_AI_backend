/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SHOW_DEMO_WIDGETS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
