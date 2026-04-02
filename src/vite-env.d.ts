/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 비우면 개발 시 Vite 프록시(동일 출처). 예: 배포 시 `https://api.example.com` */
  readonly VITE_API_URL?: string
  /** Vite proxy 대상 (기본 `http://localhost:8080`) */
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
