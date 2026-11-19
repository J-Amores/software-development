import { useCallback, useState } from "react";
import { Route, Routes } from "react-router";
import { ApplicationDetail } from "./pages/ApplicationDetail";
import { ApplicationForm } from "./pages/ApplicationForm";
import { AppShell } from "./pages/AppShell";
import { MyApplications } from "./pages/MyApplications";
import { SignIn } from "./pages/SignIn";
import { config } from "./config";
import { currentIdentityToken, forgetIdentityToken, rememberIdentityToken } from "./auth/session";

/**
 * Either the Person is signed in, or they are signing in. Signed in, the screen
 * they are on is the one the address says: an Applicant leaves the Application
 * form for their own list and comes back to the same Draft, and the browser's
 * Back button does what it looks like it does.
 *
 * The Router itself is provided around this component, so that a test can drive
 * the screens through an in-memory history.
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

  if (!signedIn) {
    return <SignIn onSignedIn={() => setSignedIn(true)} />;
  }

  return (
    <Routes>
      <Route element={<AppShell onSignOut={signOut} />}>
        <Route index element={<MyApplications />} />
        <Route path="applications/new" element={<ApplicationForm />} />
        <Route path="applications/:applicationId" element={<ApplicationDetail />} />
        <Route path="applications/:applicationId/edit" element={<ApplicationForm />} />
        <Route path="*" element={<MyApplications />} />
      </Route>
    </Routes>
  );
}
