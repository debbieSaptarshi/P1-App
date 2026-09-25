const DEFAULT_CONTACT = 'support@sevenlabs.app';

function contactEmail(): string {
  return process.env.LEGAL_CONTACT_EMAIL?.trim() || process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || DEFAULT_CONTACT;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function layout(title: string, body: string): string {
  const email = escapeHtml(contactEmail());
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(title)} · Adaptive Food Coach</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
    main { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
    a { color: #1570EF; }
    h1 { font-size: 28px; line-height: 34px; margin: 0 0 8px; }
    h2 { font-size: 18px; margin: 28px 0 8px; }
    p, li { line-height: 1.55; color: #334155; }
    .muted { color: #64748b; font-size: 14px; }
    nav { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0 28px; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <p class="muted">Adaptive Food Coach by 7Labs</p>
    <h1>${escapeHtml(title)}</h1>
    <nav>
      <a href="/legal/privacy">Privacy Policy</a>
      <a href="/legal/terms">Terms of Use</a>
      <a href="/legal/delete-account">Delete account</a>
    </nav>
    ${body}
    <p class="muted">Questions: <a href="mailto:${email}">${email}</a></p>
  </main>
</body>
</html>`;
}

export function privacyHtml(): string {
  const email = escapeHtml(contactEmail());
  return layout('Privacy Policy', `
    <p class="muted">Effective 20 September 2026</p>
    <p>Adaptive Food Coach (“the app”) helps adults log meals, activity, and progress. This policy describes what we collect and why. It is not medical advice.</p>
    <h2>Who we are</h2>
    <p>The app is operated by 7Labs. Contact <a href="mailto:${email}">${email}</a>.</p>
    <h2>Data we collect</h2>
    <ul>
      <li><strong>Account:</strong> name, email, user ID, and authentication tokens from email or Sign in with Apple / Google.</li>
      <li><strong>Profile and health-related inputs you provide:</strong> date of birth, gender, height, weight, target weight, diet preferences, goals, and workout frequency.</li>
      <li><strong>Logs:</strong> meals, exercise, weight history, and related notes.</li>
      <li><strong>Media you choose to submit:</strong> meal or label photos and voice recordings used to transcribe a log.</li>
      <li><strong>Location:</strong> precise location only while a run is active and the app is open, to estimate distance. We do not collect location in the background.</li>
      <li><strong>Community:</strong> display name, posts, comments, likes, and a logging-day score if you join a group.</li>
      <li><strong>Diagnostics:</strong> basic server logs needed to operate the service. We do not use advertising identifiers or track you across other companies’ apps.</li>
    </ul>
    <h2>How we use data</h2>
    <p>We use this information to create your account, personalize coaching estimates, sync your logs, send reminders you enable, operate community features, provide export and deletion, and keep the service secure. We do not sell personal information and we do not use your data for third-party advertising.</p>
    <h2>AI processing</h2>
    <p>If you use AI features (photo, voice, or text analysis), the relevant photo, audio, or text is sent to our configured AI provider (currently OpenAI) to generate an estimate or transcription. Media is processed to fulfill your request. The app backend does not keep the original photo or audio file after the request completes. Estimates are informational, not a clinical assessment.</p>
    <h2>Sharing</h2>
    <ul>
      <li><strong>Infrastructure:</strong> Supabase (authentication and database) and our API host.</li>
      <li><strong>AI provider:</strong> only when you use an AI feature.</li>
      <li><strong>Community:</strong> other members can see your display name, posts, and logging-day score — not your meal photos or private logs.</li>
      <li><strong>Legal:</strong> if required by law or to prevent abuse.</li>
    </ul>
    <h2>Retention</h2>
    <p>We keep account and log data until you delete the account. Server logs are kept only as long as needed for security and operations.</p>
    <h2>Your rights</h2>
    <p>You can export your data or permanently delete your account in the app under Profile → Privacy, export &amp; account deletion, or via the <a href="/legal/delete-account">account deletion</a> page. Depending on where you live (including India DPDP and UK/EU GDPR), you may also request access, correction, or deletion by emailing <a href="mailto:${email}">${email}</a>.</p>
    <h2>Children</h2>
    <p>The app is for people 18 or older. We do not knowingly collect data from children.</p>
    <h2>International transfers</h2>
    <p>Our infrastructure may process data in India and other regions where our providers operate. We take contractual and technical steps appropriate to the service.</p>
  `);
}

export function termsHtml(): string {
  const email = escapeHtml(contactEmail());
  return layout('Terms of Use', `
    <p class="muted">Effective 20 September 2026</p>
    <p>By creating an account or using Adaptive Food Coach you agree to these terms.</p>
    <h2>The service</h2>
    <p>The app provides educational food logging, activity tracking, and habit coaching. It is <strong>not</strong> a medical device, not a substitute for professional medical advice, and not intended to diagnose, treat, cure, or prevent any disease. Do not change medication, including prescription weight-management medication, except under a clinician’s direction.</p>
    <h2>Eligibility</h2>
    <p>You must be at least 18 years old.</p>
    <h2>Your account</h2>
    <p>You are responsible for the accuracy of information you log and for keeping your sign-in details safe. You may delete your account at any time as described on the <a href="/legal/delete-account">delete account</a> page.</p>
    <h2>Acceptable use</h2>
    <p>Do not post unlawful, harassing, or infringing content in community features. We may remove content, block users, or close accounts that violate these terms. You can report or block other members in the app.</p>
    <h2>Estimates and AI</h2>
    <p>Nutrition and activity figures are estimates. Photo and voice analysis can be wrong. Always use your own judgment and professional care for health decisions.</p>
    <h2>Availability</h2>
    <p>This release is free and includes a daily fair-use limit for AI requests. Features may change. We may suspend the service for maintenance or abuse prevention.</p>
    <h2>Limitation of liability</h2>
    <p>To the fullest extent permitted by law, 7Labs is not liable for health outcomes, missed reminders, or inaccurate estimates. If a consumer law in your country cannot be excluded, our liability is limited to resupplying the service.</p>
    <h2>Contact</h2>
    <p><a href="mailto:${email}">${email}</a></p>
  `);
}

export function deletionHtml(): string {
  const email = escapeHtml(contactEmail());
  return layout('Delete your account', `
    <p>You can permanently delete your Adaptive Food Coach account and associated logs.</p>
    <h2>In the app</h2>
    <ol>
      <li>Open <strong>Profile</strong>.</li>
      <li>Tap <strong>Privacy, export &amp; account deletion</strong>.</li>
      <li>Optionally tap <strong>Export my data</strong> first.</li>
      <li>Type <strong>DELETE</strong> and confirm <strong>Permanently delete account</strong>.</li>
    </ol>
    <p>This removes your account, meal and exercise logs, AI results, community posts, comments, and memberships from our production systems.</p>
    <h2>By email</h2>
    <p>If you cannot open the app, email <a href="mailto:${email}?subject=Delete%20Adaptive%20Food%20Coach%20account">${email}</a> from the address on the account with the subject “Delete Adaptive Food Coach account”. We will verify the request and complete deletion.</p>
  `);
}
