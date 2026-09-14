export const verificationURL = () => `${window.location.origin}/auth/confirm`;

export function authError(error) {
  switch (error?.code) {
    case "email_not_confirmed":
      return "Verify your email before signing in. You can request a new verification email below.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many requests. Please wait a few minutes before trying again.";
    case "email_address_not_authorized":
    case "unexpected_failure":
      return "We couldn't send the verification email. Please try again later or contact the workspace administrator.";
    case "user_already_exists":
    case "email_exists":
      return "If this address already has an account, sign in or request a new verification email.";
    case "weak_password":
      return "Choose a stronger password with at least 12 characters.";
    default:
      return error?.message || "Couldn't connect. Please try again.";
  }
}

export function validateSignup(password, confirmation) {
  if (password.length < 12)
    throw new Error("Use at least 12 characters for your password.");
  if (new TextEncoder().encode(password).length > 72)
    throw new Error(
      "Use a password no longer than 72 bytes (72 plain English characters).",
    );
  if (password !== confirmation) throw new Error("Passwords don't match.");
}
