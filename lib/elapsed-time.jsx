import { comp } from './comp';
import './elapsed-time.css';

function computeElapsedTime(startTime) {
  const elapsedMs = Date.now() - startTime;
  const sec = Math.floor(elapsedMs / 1000) % 60;
  const min = Math.floor(sec / 60) % 60;
  const h = Math.floor(min / 60);

  return `${h ? h + ':' : ''}${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export const ElapsedTime = comp((_props, hooks) => {
  const startTime = hooks.useMemo(() => Date.now());
  const [elapsedTime, setElapsedTime] = hooks.useState(computeElapsedTime(startTime));

  hooks.useEffect(() => {
    let timeout = setTimeout(function tick() {
      setElapsedTime(computeElapsedTime(startTime));
      timeout = setTimeout(tick, 1000);
    }, 1000);
    return () => clearTimeout(timeout);
  });

  return <span class="quikpik-elapsed-time">Recording {elapsedTime}</span>;
});
