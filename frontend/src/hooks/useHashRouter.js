import { useState, useEffect } from 'react';

export function useHashRouter() {
  const [hash, setHash] = useState(window.location.hash || '#landing');

  useEffect(() => {
    const handler = () => setHash(window.location.hash || '#landing');
    window.addEventListener('hashchange', handler);
    if (!window.location.hash) window.location.hash = '#landing';
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (newHash) => {
    window.location.hash = newHash;
  };

  // Parse route: #section/sub/id?param=value
  const parseRoute = (h) => {
    const clean = h.replace(/^#\/?/, '');
    const [pathPart, queryPart] = clean.split('?');
    const parts = (pathPart || 'landing').split('/');
    return {
      base: parts[0] || 'landing',
      sub: parts[1] || null,
      id: parts[2] || null,
      full: clean,
      queryString: queryPart || ''
    };
  };

  return { hash, navigate, route: parseRoute(hash) };
}
