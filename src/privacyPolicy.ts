const effectiveDate = 'July 3, 2026';

export function privacyPolicyResponse() {
  return new Response(renderPrivacyPolicy(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function renderPrivacyPolicy() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Privacy Policy | Vinago+</title>
    <meta name="description" content="Privacy Policy for Vinago+, a Vietnam travel planning app.">
    <style>
      :root {
        color-scheme: light;
        --brand: #da251d;
        --ink: #1c1f24;
        --muted: #5d6675;
        --line: #e4e7ec;
        --paper: #ffffff;
        --wash: #f7f8fa;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--wash);
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        line-height: 1.65;
      }

      .topbar {
        background: var(--paper);
        border-bottom: 1px solid var(--line);
      }

      .topbar-inner,
      main {
        width: min(920px, calc(100% - 32px));
        margin: 0 auto;
      }

      .topbar-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 0;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: inherit;
        font-weight: 800;
        letter-spacing: 0;
        text-decoration: none;
      }

      .mark {
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        border-radius: 8px;
        background: var(--brand);
        color: #fff;
        font-size: 18px;
        font-weight: 900;
      }

      .home-link {
        color: var(--brand);
        font-weight: 700;
        text-decoration: none;
      }

      main {
        padding: 40px 0 64px;
      }

      .document {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: clamp(24px, 5vw, 48px);
      }

      h1,
      h2 {
        line-height: 1.25;
        letter-spacing: 0;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(32px, 6vw, 52px);
      }

      h2 {
        margin: 36px 0 10px;
        font-size: clamp(21px, 3vw, 28px);
      }

      p {
        margin: 0 0 16px;
      }

      ul {
        margin: 0 0 18px;
        padding-left: 22px;
      }

      li {
        margin: 7px 0;
      }

      a {
        color: var(--brand);
        font-weight: 700;
      }

      .updated {
        color: var(--muted);
        font-weight: 700;
      }

      .note {
        border-left: 4px solid var(--brand);
        margin: 28px 0 0;
        padding: 14px 16px;
        background: #fff5f4;
        color: #3b2020;
      }

      footer {
        color: var(--muted);
        margin-top: 24px;
        text-align: center;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="/">
          <span class="mark">V</span>
          <span>Vinago+</span>
        </a>
        <a class="home-link" href="/">Back to app</a>
      </div>
    </header>

    <main>
      <article class="document">
        <h1>Privacy Policy</h1>
        <p class="updated">Effective date: ${effectiveDate}</p>
        <p>
          Vinago+ helps travelers plan trips in Vietnam. This Privacy Policy explains what
          information we collect, how we use it, and the choices you have when using our app
          and website at vinago.aiautotool.com.
        </p>

        <h2>Information We Collect</h2>
        <p>We collect information you provide or generate while using Vinago+, including:</p>
        <ul>
          <li>Account information from Google Sign-In, such as your name, email address, profile photo, and Google account identifier.</li>
          <li>Travel preferences, such as language, trip purpose, current city, trip length, favorites, recent searches, and saved activity history.</li>
          <li>AI itinerary requests and generated itinerary content that you ask us to create or email to you.</li>
          <li>Device and usage information, such as app events, browser type, approximate region, pages viewed, and diagnostics.</li>
        </ul>

        <h2>Local Storage</h2>
        <p>
          Vinago+ stores some data on your device to keep the app useful between sessions,
          including profile preferences, favorites, settings, activity history, recent searches,
          authentication session details, and queued analytics events.
        </p>

        <h2>How We Use Information</h2>
        <ul>
          <li>Provide, personalize, and improve trip planning features.</li>
          <li>Save your preferences, favorites, and account state.</li>
          <li>Send itinerary confirmations when you request email delivery.</li>
          <li>Measure app reliability, performance, and feature usage.</li>
          <li>Protect the service from abuse and troubleshoot issues.</li>
        </ul>

        <h2>Service Providers</h2>
        <p>
          We use trusted providers to operate Vinago+, including Google Sign-In, Google Analytics,
          Cloudflare hosting and security, Resend for requested itinerary emails, and map or place
          data services such as OpenStreetMap. These providers process information according to
          their own privacy terms and our service configuration.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your personal information. We may share information with service providers
          that help us run Vinago+, comply with legal obligations, protect rights and safety, or
          complete a business transfer such as a merger or acquisition.
        </p>

        <h2>Data Retention</h2>
        <p>
          We keep information only as long as needed for the purposes described in this policy,
          unless a longer retention period is required by law. Data stored locally remains on your
          device until you delete it, sign out, reset the app, or uninstall the app.
        </p>

        <h2>Your Choices</h2>
        <ul>
          <li>You can use parts of the app without signing in.</li>
          <li>You can sign out of Google Sign-In from the account screen.</li>
          <li>You can clear locally stored app data by resetting the app or uninstalling it.</li>
          <li>You can control analytics and permissions through your browser, device, or platform settings where available.</li>
        </ul>

        <h2>Children</h2>
        <p>
          Vinago+ is not intended for children under 13. We do not knowingly collect personal
          information from children under 13.
        </p>

        <h2>International Processing</h2>
        <p>
          Your information may be processed in countries other than where you live. We use service
          providers that may store or process data globally.
        </p>

        <h2>Security</h2>
        <p>
          We use reasonable technical and organizational safeguards to protect information. No
          internet service is completely secure, so we cannot guarantee absolute security.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. When we do, we will change the
          effective date above.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions or requests about this Privacy Policy, contact us at
          <a href="mailto:info@aiautotool.com">info@aiautotool.com</a>.
        </p>

        <p class="note">
          This page is provided for app store and user transparency. It is not a substitute for
          legal advice.
        </p>
      </article>
      <footer>© 2026 Vinago+</footer>
    </main>
  </body>
</html>`;
}
