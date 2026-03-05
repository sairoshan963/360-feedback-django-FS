import { useState, useEffect, useCallback } from 'react';
import { Alert, Space, Button } from 'antd';
import { BellOutlined, CloseOutlined } from '@ant-design/icons';
import { getActiveAnnouncements } from '../../api/announcements';

const STORAGE_KEY = 'dismissed_announcements';

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function addDismissed(id) {
  const list = getDismissed();
  if (!list.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...list, id]));
  }
}

const TYPE_MAP = { info: 'info', warning: 'warning', success: 'success' };

export default function AnnouncementBanner() {
  const [banners, setBanners] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await getActiveAnnouncements();
      const dismissed = getDismissed();
      const visible = (res.data?.announcements || []).filter((a) => !dismissed.includes(a.id));
      setBanners(visible);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const dismiss = (id) => {
    addDismissed(id);
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  if (!banners.length) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {banners.map((b) => (
        <Alert
          key={b.id}
          type={TYPE_MAP[b.type] || 'info'}
          banner
          showIcon
          icon={<BellOutlined />}
          message={
            <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>{b.message}</span>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => dismiss(b.id)}
                style={{ color: 'inherit', opacity: 0.7, flexShrink: 0 }}
              />
            </Space>
          }
          style={{ borderRadius: 0, padding: '7px 20px', fontSize: 13 }}
        />
      ))}
    </div>
  );
}
