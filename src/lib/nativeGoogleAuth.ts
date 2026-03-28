import { isNativeApp } from "@/lib/platform";

type NativeGoogleAuthModule = {
  GoogleAuth: {
    signIn: () => Promise<{
      authentication?: {
        idToken?: string | null;
      } | null;
    }>;
  };
};

const GOOGLE_AUTH_MODULE = "@codetrix-studio/capacitor-google-auth";

export const signInWithNativeGoogle = async () => {
  if (!isNativeApp()) {
    return null;
  }

  const nativeModule = await import(
    /* @vite-ignore */
    GOOGLE_AUTH_MODULE
  ) as NativeGoogleAuthModule;

  return nativeModule.GoogleAuth.signIn();
};
