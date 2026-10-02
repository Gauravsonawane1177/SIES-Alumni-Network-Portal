import { useEffect, useState } from 'react';
import api from '../services/api';

export function useNotifications(pollMs = 20000) {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await api.get('/notifications');
        if (!mounted) return;
        setUnread(data.data.unread || 0);
        setItems(data.data.notifications || []);
      } catch {
        /* session may not be ready */
      }
    }
    load();
    const id = setInterval(load, pollMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return { unread, items };
}
