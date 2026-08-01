export interface PwaPlatformState {
  readonly supported: boolean;
  readonly ios: boolean;
  readonly standalone: boolean;
}

export function detectPwaPlatform(
  userAgent: string,
  standaloneMedia: boolean,
  navigatorStandalone: boolean | undefined,
  serviceWorkerSupported: boolean,
  pushSupported: boolean
): PwaPlatformState {
  const ios =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && /Mobile/.test(userAgent));
  return {
    supported: serviceWorkerSupported && pushSupported,
    ios,
    standalone: standaloneMedia || navigatorStandalone === true,
  };
}

export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const decoded = window.atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(decoded.length));
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
}
