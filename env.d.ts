// env.d.ts
/// <reference types="vite/client" />

interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  interface ImportMetaEnv {
    readonly VITE_PROD_PATH?: string;
    readonly REACT_APP_RECAPTCHA_SITE_KEY?: string;
    // добавьте другие переменные, которые вы используете
    readonly [key: string]: string | undefined;
  }