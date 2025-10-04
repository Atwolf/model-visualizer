/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAUTOBOT_URL: string
  readonly VITE_NAUTOBOT_API_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
