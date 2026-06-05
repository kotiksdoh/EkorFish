type WrapHtmlContentOptions = {
  isDark?: boolean;
  title?: string;
};

function getTheme(isDark: boolean) {
  return {
    bg: isDark ? '#151516' : '#FFFFFF',
    text: isDark ? '#FBFCFF' : '#1B1B1C',
    muted: isDark ? 'rgba(251, 252, 255, 0.65)' : '#80818B',
    accent: isDark ? '#4C94FF' : '#203686',
    border: isDark ? '#252527' : '#F0F3F7',
    card: isDark ? '#202022' : '#F8FAFC',
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Оборачивает HTML-фрагмент с API в полноценную страницу со стилями приложения */
export function wrapHtmlContent(
  htmlFragment: string,
  { isDark = false, title }: WrapHtmlContentOptions = {},
): string {
  const theme = getTheme(isDark);
  const titleBlock = title
    ? `<h1 class="page-title">${escapeHtml(title)}</h1>`
    : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: ${theme.bg};
      -webkit-text-size-adjust: 100%;
    }
    body {
      padding: 20px 16px 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: ${theme.text};
    }
    .content {
      max-width: 640px;
      margin: 0 auto;
      word-wrap: break-word;
    }
    .page-title {
      font-size: 20px;
      line-height: 1.35;
      font-weight: 700;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
      color: ${theme.text};
    }
    .content p {
      margin: 0 0 14px;
    }
    .content p:last-child {
      margin-bottom: 0;
    }
    .content b,
    .content strong {
      font-weight: 600;
      color: ${theme.text};
    }
    .content i,
    .content em {
      font-style: italic;
      color: ${theme.muted};
    }
    .content a {
      color: ${theme.accent};
      text-decoration: none;
      word-break: break-word;
    }
    .content a:active {
      opacity: 0.8;
    }
    .content h1,
    .content h2,
    .content h3 {
      color: ${theme.text};
      font-weight: 600;
      line-height: 1.35;
      margin: 20px 0 10px;
    }
    .content h1 { font-size: 20px; }
    .content h2 { font-size: 18px; }
    .content h3 { font-size: 16px; }
    .content ul,
    .content ol {
      margin: 0 0 14px;
      padding-left: 22px;
    }
    .content li {
      margin-bottom: 8px;
    }
    .content li::marker {
      color: ${theme.accent};
    }
    .content br {
      display: block;
      content: "";
      margin-top: 8px;
    }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin: 12px 0;
      display: block;
    }
    .content table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px;
      font-size: 14px;
    }
    .content th,
    .content td {
      border: 1px solid ${theme.border};
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    .content th {
      background: ${theme.card};
      font-weight: 600;
    }
    .content blockquote {
      margin: 12px 0;
      padding: 12px 14px;
      border-left: 3px solid ${theme.accent};
      background: ${theme.card};
      border-radius: 0 12px 12px 0;
      color: ${theme.muted};
    }
    .content code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 14px;
      background: ${theme.card};
      padding: 2px 6px;
      border-radius: 6px;
    }
    .content pre {
      margin: 12px 0;
      padding: 14px;
      background: ${theme.card};
      border: 1px solid ${theme.border};
      border-radius: 12px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.45;
    }
    .content hr {
      border: none;
      border-top: 1px solid ${theme.border};
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <article class="content">
    ${titleBlock}
    ${htmlFragment}
  </article>
</body>
</html>`;
}
