import { Capacitor } from "@capacitor/core";

export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};
