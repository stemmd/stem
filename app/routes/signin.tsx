import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireNoUser } from "~/lib/auth.server";
import { API_BASE } from "~/lib/config";
import { StemMark } from "~/components/StemMark";

export const meta: MetaFunction = () => [{ title: "Sign in — Stem" }];

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireNoUser(request, context);
  const errorParam = new URL(request.url).searchParams.get("error");
  const linkError =
    errorParam === "invalid_link"
      ? "That link has expired or already been used. Enter your email to get a new one."
      : errorParam === "not_invited"
      ? "stem is invite-only right now. Join the waitlist at stem.md."
      : null;
  return json({ linkError });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = (form.get("email") as string || "").toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return json({ error: "Please enter a valid email address.", email: "" });
  }

  try {
    const res = await fetch(`${API_BASE}/auth/send-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstile: form.get("cf-turnstile-response") || "" }),
    });

    const data = await res.json<{ success?: boolean; error?: string }>();
    if (!res.ok || !data.success) {
      const errorMessages: Record<string, string> = {
        captcha_failed: "Verification failed. Please try again.",
        not_on_waitlist: "stem is invite-only right now.",
        not_invited_yet: "You're on the list — we'll send your invite soon.",
        rate_limited: "Too many attempts. Try again in an hour.",
        email_failed: "Something went wrong sending the email. Try again.",
      };
      const msg = data.error ? (errorMessages[data.error] ?? "Something went wrong. Try again.") : "Something went wrong. Try again.";
      return json({ error: msg, email });
    }

    return json({ success: true, email });
  } catch {
    return json({ error: "Something went wrong. Try again.", email });
  }
}

export default function SignIn() {
  const { linkError } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const actionError = actionData && "error" in actionData ? actionData.error : undefined;
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";

  if (actionData && "success" in actionData && actionData.success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ marginBottom: 24 }}><StemMark /></div>
          <h1 style={styles.heading}>Check your email.</h1>
          <p style={styles.subheading}>
            We sent a link to{" "}
            <span style={{ fontFamily: "'DM Mono', monospace", color: "var(--ink)" }}>
              {actionData.email}
            </span>
            .
          </p>
          <p style={styles.hint}>The link expires in 15 minutes.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div style={styles.card}>
        <StemMark />
        <h1 style={styles.heading}>Sign in to Stem.</h1>
        <p style={styles.subheading}>
          No password. Just a link in your inbox.
        </p>

        <a href="/auth/google" style={styles.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        <Form method="post" style={styles.form}>
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            autoFocus
            defaultValue={actionData?.email ?? ""}
            style={styles.input}
          />
          {(linkError || actionError) && (
            <p style={styles.error}>{linkError ?? actionError}</p>
          )}
          <div className="cf-turnstile" data-sitekey="0x4AAAAAACzDdtqFQgWP_8FO" data-theme="auto" data-size="normal" />
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Sending…" : "Send me a link"}
          </button>
        </Form>

        <p style={styles.legal}>
          By signing in you agree to our{" "}
          <Link to="/terms" style={styles.legalLink}>Terms</Link>
          {" "}and{" "}
          <Link to="/privacy" style={styles.legalLink}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}


const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "var(--paper)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  heading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 32,
    fontWeight: 400,
    color: "var(--ink)",
    marginBottom: 8,
  },
  subheading: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    color: "var(--ink-mid)",
    marginBottom: 32,
    lineHeight: 1.5,
  },
  hint: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 13,
    color: "var(--ink-light)",
    marginTop: 16,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "var(--paper-mid)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontSize: 15,
    color: "var(--ink)",
    outline: "none",
    transition: "border-color 0.15s",
  },
  button: {
    width: "100%",
    padding: "12px 24px",
    background: "var(--forest)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    transition: "background 0.15s, opacity 0.15s",
    cursor: "pointer",
  },
  error: {
    fontSize: 13,
    color: "var(--taken)",
    textAlign: "left",
  },
  legal: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: "var(--ink-light)",
    marginTop: 24,
    lineHeight: 1.5,
  },
  legalLink: {
    color: "var(--ink-mid)",
    textDecoration: "underline",
    textDecorationColor: "var(--paper-dark)",
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "11px 24px",
    background: "var(--surface)",
    border: "1.5px solid var(--paper-dark)",
    borderRadius: 8,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    color: "var(--ink)",
    textDecoration: "none",
    cursor: "pointer",
    marginTop: 24,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "var(--paper-dark)",
  },
  dividerText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "var(--ink-light)",
  },
};
