import { useEffect, useState } from 'react';

/** Layout bands from README: <820 mobile, 820–959 pill tabs, ≥960 sidebar. */
export function useViewport() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return { width: w, mobile: w < 820, sidebar: w >= 960, tabRow: w >= 820 && w < 960 };
}
