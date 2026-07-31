export function describePushDevice(userAgent: string | null): string {
  if (!userAgent) return "מכשיר";
  if (/iPhone/i.test(userAgent)) return "iPhone";
  if (/iPad/i.test(userAgent)) return "iPad";
  if (/Android/i.test(userAgent)) return "מכשיר Android";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "מחשב Windows";
  return "דפדפן מחובר";
}
