import { useCallback, useState } from "react";
import { Home } from "./pages/Home";
import { SignIn } from "./pages/SignIn";
import { config } from "./config";
import { currentIdentityToken, forgetIdentityToken, rememberIdentityToken } from "./auth/session";

/**
 * Either the Person is signed in, or they are signing in. The screens the rest of
 * the Program needs arrive with their own slices.
 */
export function App() {
  const [signedIn, setSignedIn] = useState(() => {
    // In demo mode there is no Cognito: the mock accepts any token, and the
    // persona picker replaces sign-in in ticket 16.
    if (config.demoMode) {
      rememberIdentityToken("demo");
      return true;
    }
    return currentIdentityToken() !== null;
  });

  const signOut = useCallback(() => {
    forgetIdentityToken();
    setSignedIn(false);
  }, []);

  return signedIn ? <Home onSignOut={signOut} /> : <SignIn onSignedIn={() => setSignedIn(true)} />;
}
