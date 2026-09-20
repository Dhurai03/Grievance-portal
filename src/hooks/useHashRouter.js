import { useState, useEffect } from 'react';

export function useHashRouter() {
  const [hash, setHash] = useState(window.location.hash || '#landing');

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '#landing');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newHash) => {
    // If no leading hash symbol, prepend it
    const formattedHash = newHash.startsWith('#') ? newHash : `#${newHash}`;
    window.location.hash = formattedHash;
  };

  // Parses hash like "#grievance/detail/GRV-2026-000101" into parts
  const getRouteParts = () => {
    const path = hash.replace(/^#/, ''); // Remove leading '#'
    const parts = path.split('/').filter(Boolean); // Split by '/' and filter out empty strings
    
    return {
      path,
      base: parts[0] || 'landing',
      sub: parts[1] || null,
      id: parts[2] || null,
      parts
    };
  };

  const route = getRouteParts();

  return {
    hash,
    navigate,
    route
  };
}
