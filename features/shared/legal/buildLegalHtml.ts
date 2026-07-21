import { LEGAL_CONFIG } from './legalConfig';

export type LegalDocumentId =
  | 'privacy'
  | 'personalDataConsent'
  | 'license'
  | 'userAgreement';

export const LEGAL_DOCUMENT_TITLES: Record<LegalDocumentId, string> = {
  privacy: 'Политика конфиденциальности',
  personalDataConsent: 'Согласие на обработку персональных данных',
  license: 'Лицензионное соглашение',
  userAgreement: 'Пользовательское соглашение',
};

type BuildLegalHtmlOptions = {
  documentId: LegalDocumentId;
  isDark?: boolean;
  operatorEmail?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mailtoLink(email: string, label?: string): string {
  const safeEmail = escapeHtml(email);
  const text = escapeHtml(label ?? email);
  return `<a href="mailto:${safeEmail}">${text}</a>`;
}

function wrapDocument(title: string, body: string, isDark: boolean): string {
  const bg = isDark ? '#151516' : '#FFFFFF';
  const text = isDark ? '#FBFCFF' : '#1B1B1C';
  const muted = isDark ? 'rgba(251, 252, 255, 0.65)' : '#80818B';
  const accent = isDark ? '#4C94FF' : '#203686';
  const border = isDark ? '#252527' : '#F0F3F7';
  const card = isDark ? '#202022' : '#F8FAFC';

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px 16px 32px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.55;
      color: ${text};
      background: ${bg};
      -webkit-text-size-adjust: 100%;
    }
    .doc {
      max-width: 640px;
      margin: 0 auto;
    }
    h1 {
      font-size: 22px;
      line-height: 1.3;
      font-weight: 700;
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      color: ${muted};
      font-size: 13px;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 17px;
      font-weight: 600;
      margin: 28px 0 12px;
      padding-top: 4px;
      border-top: 1px solid ${border};
    }
    h2:first-of-type { border-top: none; margin-top: 8px; }
    p { margin: 0 0 12px; }
    ol, ul { margin: 0 0 12px; padding-left: 22px; }
    li { margin-bottom: 8px; }
    li::marker { color: ${accent}; font-weight: 600; }
    .term {
      background: ${card};
      border: 1px solid ${border};
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 10px;
    }
    .term strong { color: ${accent}; display: block; margin-bottom: 4px; }
    a { color: ${accent}; text-decoration: none; word-break: break-all; }
    .note {
      margin-top: 24px;
      padding: 14px;
      border-radius: 12px;
      background: ${card};
      border: 1px solid ${border};
      font-size: 13px;
      color: ${muted};
    }
  </style>
</head>
<body>
  <article class="doc">
    <h1>${escapeHtml(title)}</h1>
    ${body}
  </article>
</body>
</html>`;
}

function buildPrivacyPolicyHtml(
  _operatorName: string,
  _appName: string,
  _operatorEmail: string,
  isDark: boolean,
): string {
  const emailLink = mailtoLink('info@ekorfish.ru');

  const body = `
    <p>Настоящая Политика обработки персональных данных (далее — Политика) разработана в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных и меры по обеспечению их безопасности, предпринимаемые Оператором.</p>

    <h2>1. Общие положения и термины</h2>
    <div class="term"><strong>Оператор</strong> — ООО «ПТК ЭКОР», организующее и осуществляющее обработку персональных данных.</div>
    <div class="term"><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определённому физическому лицу (субъекту персональных данных).</div>
    <div class="term"><strong>Сайт</strong> — совокупность веб-страниц, размещённых по адресу ekorfish.ru.</div>
    <div class="term"><strong>Пользователь</strong> — любой посетитель Сайта.</div>
    <p>Использование Сайта означает согласие Пользователя с настоящей Политикой и условиями обработки его персональных данных.</p>

    <h2>2. Оператор и контактные данные</h2>
    <p>Наименование: ООО «ПТК ЭКОР»<br />
    ИНН 7718741865, КПП 772201001, ОГРН 1167746243345<br />
    Юридический адрес: 111024, город Москва, 2-я Кабельная ул, д. 2 стр. 5, ком. 8б</p>
    <p>E-mail: ${emailLink}</p>
    <p>Телефон: 8 (800) 505-01-82</p>

    <h2>3. Цели обработки персональных данных</h2>
    <p>Персональные данные обрабатываются в следующих целях:</p>
    <ul>
      <li>обработка и исполнение заказов, заключение и исполнение договоров;</li>
      <li>организация доставки товаров;</li>
      <li>связь с Пользователем, в том числе направление уведомлений и ответов на запросы;</li>
      <li>регистрация и ведение личного кабинета;</li>
      <li>улучшение работы Сайта и качества обслуживания;</li>
      <li>проведение статистических и маркетинговых исследований.</li>
    </ul>

    <h2>4. Перечень обрабатываемых персональных данных</h2>
    <p>Оператор может обрабатывать следующие данные:</p>
    <ul>
      <li>фамилия, имя, отчество;</li>
      <li>адрес электронной почты;</li>
      <li>номер контактного телефона;</li>
      <li>адрес доставки;</li>
      <li>данные о заказах;</li>
      <li>обезличенные данные о посещениях (cookie, IP-адрес, данные веб-аналитики).</li>
    </ul>

    <h2>5. Правовые основания обработки</h2>
    <p>Обработка персональных данных осуществляется на основании Федерального закона № 152-ФЗ, согласия субъекта персональных данных, а также договоров, заключаемых с Оператором.</p>

    <h2>6. Порядок и условия обработки, передача третьим лицам</h2>
    <p>Обработка персональных данных осуществляется с использованием средств автоматизации и без таковых. Оператор принимает необходимые правовые, организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования и распространения.</p>
    <p>Оператор вправе передавать персональные данные третьим лицам (службам доставки, платёжным и иным контрагентам) исключительно в целях, указанных в разделе 3, и в объёме, необходимом для их достижения.</p>

    <h2>7. Cookie и данные веб-аналитики</h2>
    <p>Сайт использует файлы cookie и сервисы веб-аналитики для корректной работы и улучшения сервиса. Пользователь может отключить cookie в настройках браузера.</p>
    <p>Оператор, при обработке персональных данных, полученных через Сайт, Сайты мероприятий может передавать персональные данные сторонним сервисам аналитики и рекламы:</p>
    <ul>
      <li>Яндекс.Метрика — ООО «ЯНДЕКС», Адрес: 119021, г. Москва, ул. Льва Толстого, д. 16;</li>
      <li>Яндекс.Директ — ООО «ЯНДЕКС», Адрес: 119021, г. Москва, ул. Льва Толстого, д. 16.</li>
    </ul>

    <h2>8. Права субъекта персональных данных</h2>
    <p>Субъект персональных данных имеет право:</p>
    <ul>
      <li>получать информацию об обработке своих персональных данных;</li>
      <li>требовать уточнения, блокирования или уничтожения данных в случае их неполноты, неточности или неправомерной обработки;</li>
      <li>отозвать согласие на обработку персональных данных;</li>
      <li>обжаловать действия Оператора в уполномоченный орган или в судебном порядке.</li>
    </ul>
    <p>Для реализации своих прав субъект может направить обращение по адресу ${emailLink}.</p>

    <h2>9. Сроки хранения и порядок удаления данных</h2>
    <p>Персональные данные хранятся не дольше, чем этого требуют цели их обработки, если иной срок не установлен законодательством. По достижении целей обработки или при отзыве согласия данные удаляются либо обезличиваются.</p>

    <h2>10. Заключительные положения</h2>
    <p>Оператор вправе вносить изменения в настоящую Политику. Новая редакция вступает в силу с момента её размещения на Сайте.</p>
    <p class="note">Дата последней редакции: 02.06.2026.</p>
  `;

  return wrapDocument(LEGAL_DOCUMENT_TITLES.privacy, body, isDark);
}

function buildPersonalDataConsentHtml(
  operatorName: string,
  appName: string,
  operatorEmail: string,
  isDark: boolean,
): string {
  const emailLink = mailtoLink(operatorEmail);

  const body = `
    <p class="subtitle">на обработку персональных данных</p>
    <p>Настоящим я, действуя свободно, своей волей и в своём интересе, даю согласие ${escapeHtml(operatorName)} (Оператор) на обработку моих персональных данных в мобильном приложении ${escapeHtml(appName)} на условиях Политики конфиденциальности.</p>
    <p>Согласие распространяется на обработку следующих данных: номер телефона, адрес электронной почты, ФИО, сведения об организации, адреса доставки и сведения о заказах.</p>
    <p>Цели обработки: регистрация и авторизация, оформление и исполнение заказов, обратная связь с Пользователем, восстановление доступа к учётной записи.</p>
    <p>Согласие действует до момента его отзыва. Отзыв возможен путём направления обращения на ${emailLink} с темой «Отзыв согласия на обработку персональных данных».</p>
    <p class="note">Продолжая регистрацию или вход в приложение, вы подтверждаете, что ознакомлены с Политикой конфиденциальности и принимаете условия настоящего согласия.</p>
  `;

  return wrapDocument(LEGAL_DOCUMENT_TITLES.personalDataConsent, body, isDark);
}

function buildLicenseAgreementHtml(
  operatorName: string,
  appName: string,
  isDark: boolean,
): string {
  const body = `
    <p class="subtitle">лицензия на использование мобильного приложения</p>
    <p>${escapeHtml(operatorName)} (Лицензиар) предоставляет Пользователю неисключительную, непередаваемую, отзывную лицензию на использование мобильного приложения ${escapeHtml(appName)} на устройствах под управлением iOS и Android в личных и деловых целях в рамках функционала приложения.</p>

    <h2>1. Предмет соглашения</h2>
    <p>Приложение предназначено для оформления заказов, просмотра каталога продукции, управления профилем и взаимодействия с сервисами Оператора. Любое иное использование, включая декомпиляцию, модификацию, распространение копий приложения без согласия Лицензиара, запрещено.</p>

    <h2>2. Ограничения</h2>
    <ul>
      <li>запрещается обход технических средств защиты приложения;</li>
      <li>запрещается использование приложения способами, нарушающими законодательство РФ;</li>
      <li>Лицензиар вправе ограничить доступ при нарушении условий настоящего соглашения.</li>
    </ul>

    <h2>3. Интеллектуальная собственность</h2>
    <p>Все права на приложение, дизайн, товарные знаки и контент принадлежат Лицензиару или правообладателям. Настоящее соглашение не передаёт Пользователю права собственности на программное обеспечение.</p>

    <h2>4. Ответственность</h2>
    <p>Приложение предоставляется «как есть». Лицензиар не несёт ответственности за перебои связи, действия третьих лиц и убытки, возникшие вследствие использования приложения вне предусмотренного функционала.</p>

    <h2>5. Заключительные положения</h2>
    <p>Лицензиар вправе изменять условия соглашения. Актуальная версия публикуется в приложении. Продолжение использования приложения означает согласие с обновлёнными условиями.</p>
  `;

  return wrapDocument(LEGAL_DOCUMENT_TITLES.license, body, isDark);
}

function buildUserAgreementHtml(
  operatorName: string,
  appName: string,
  operatorEmail: string,
  isDark: boolean,
): string {
  const emailLink = mailtoLink(operatorEmail);

  const body = `
    <p class="subtitle">условия использования сервиса</p>
    <p>Настоящее Пользовательское соглашение регулирует отношения между ${escapeHtml(operatorName)} (Оператор) и пользователем мобильного приложения ${escapeHtml(appName)} (Пользователь).</p>

    <h2>1. Общие положения</h2>
    <p>Регистрация и использование приложения означают принятие условий настоящего соглашения и Политики конфиденциальности.</p>

    <h2>2. Регистрация и учётная запись</h2>
    <p>Пользователь обязуется предоставлять достоверные данные при регистрации и поддерживать их актуальность. Пользователь несёт ответственность за сохранность доступа к своей учётной записи.</p>

    <h2>3. Заказы и оплата</h2>
    <p>Оформление заказа через приложение является офертой в порядке, установленном действующим законодательством и правилами Оператора. Стоимость, наличие товаров и условия доставки указываются в приложении на момент оформления заказа.</p>

    <h2>4. Права и обязанности сторон</h2>
    <p>Оператор обеспечивает работу приложения и обработку заказов в разумные сроки. Пользователь обязуется не нарушать права третьих лиц и не использовать сервис в противоправных целях.</p>

    <h2>5. Обращения</h2>
    <p>По вопросам работы приложения Пользователь может обратиться к Оператору: ${emailLink}.</p>
  `;

  return wrapDocument(LEGAL_DOCUMENT_TITLES.userAgreement, body, isDark);
}

export function buildLegalDocumentHtml({
  documentId,
  isDark = false,
  operatorEmail,
}: BuildLegalHtmlOptions): string {
  const email =
    operatorEmail?.trim() || LEGAL_CONFIG.fallbackOperatorEmail;
  const { operatorName, appName } = LEGAL_CONFIG;

  switch (documentId) {
    case 'privacy':
      return buildPrivacyPolicyHtml(operatorName, appName, email, isDark);
    case 'personalDataConsent':
      return buildPersonalDataConsentHtml(operatorName, appName, email, isDark);
    case 'license':
      return buildLicenseAgreementHtml(operatorName, appName, isDark);
    case 'userAgreement':
      return buildUserAgreementHtml(operatorName, appName, email, isDark);
    default:
      return buildPrivacyPolicyHtml(operatorName, appName, email, isDark);
  }
}
