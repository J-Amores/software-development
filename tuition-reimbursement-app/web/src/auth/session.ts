/**
 * The signed-in Person's identity token, for as long as this tab is open. It is
 * deliberately not in localStorage: a token in localStorage outlives the tab and
 * is readable by any script that gets onto the page.
 */
const TOKEN_KEY = "tuition.identity-token";

export function currentIdentityToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    // Private browsing, or storage the browser refuses: the Person signs in again.
    return null;
  }
}

export function rememberIdentityToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Nothing to do: the token stays in memory for this page only.
  }
}

export function forgetIdentityToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Already gone as far as this tab is concerned.
  }
}
