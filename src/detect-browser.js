export function isSafari() {
  const agent = navigator.userAgent.toLowerCase();
  return agent.includes("safari/") && !agent.includes("chrome");
}
