import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Gamyam 360° Feedback` : 'Gamyam 360° Feedback';
    return () => { document.title = 'Gamyam 360° Feedback'; };
  }, [title]);
}
