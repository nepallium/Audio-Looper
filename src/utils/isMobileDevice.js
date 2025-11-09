export default function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|android|windows phone/g.test(userAgent);
}
