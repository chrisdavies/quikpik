export function isIOS() {
  const agent = navigator.userAgent.toLowerCase();
  return agent.includes('safari/') && /ip(ad|hone|od)/.test(agent);
}
