import { useState, useEffect, useRef } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Spin, Divider, Popconfirm } from 'antd';
import { NotificationOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, dismissNotification, clearAllNotifications } from '../../api/notifications';

const { Text } = Typography;

const TYPE_COLOR = {
  info:     '#1677ff',
  warning:  '#faad14',
  success:  '#52c41a',
  deadline: '#ff4d4f',
  GENERAL:  '#1677ff',
  NOMINATION_OPEN: '#faad14',
  CYCLE_ACTIVATED: '#52c41a',
  RESULTS_RELEASED: '#722ed1',
};

export default function NotificationBell() {
  const navigate  = useNavigate();
  const [open, setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading, setLoading]    = useState(false);
  const dropdownRef = useRef(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = async (item) => {
    // Optimistically mark as read in local state immediately
    setNotifications((prev) => prev.map((n) => n.id === item.id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - (item.is_read ? 0 : 1)));
    try { await markAsRead(item.id); } catch { /* silent */ }
    if (item.link) {
      setOpen(false);
      navigate(item.link);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try { await markAllAsRead(); } catch { /* silent */ }
  };

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => {
      const notif = notifications.find((n) => n.id === id);
      return notif && !notif.is_read ? Math.max(0, c - 1) : c;
    });
    try { await dismissNotification(id); } catch { /* silent */ }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    try { await clearAllNotifications(); } catch { /* silent */ }
  };

  const dropdownContent = (
    <div
      style={{
        width: 380,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid #f0f0f0',
      }}>
        <Text strong style={{ fontSize: 14 }}>Notifications</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <Button size="small" type="link" style={{ padding: 0 }} onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Popconfirm
              title="Clear all notifications?"
              onConfirm={handleClearAll}
              okText="Clear"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" type="link" danger style={{ padding: 0 }}>
                Clear all
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : notifications.length === 0 ? (
        <Empty description="No notifications" style={{ padding: 32 }} />
      ) : (
        <List
          style={{ maxHeight: 420, overflowY: 'auto' }}
          dataSource={notifications.slice(0, 15)}
          renderItem={(item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                cursor: item.link ? 'pointer' : 'default',
                background: item.is_read ? '#fff' : '#f0f7ff',
                borderLeft: `3px solid ${TYPE_COLOR[item.type] || '#d9d9d9'}`,
                borderBottom: '1px solid #f5f5f5',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = item.is_read ? '#fafafa' : '#e6f4ff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = item.is_read ? '#fff' : '#f0f7ff'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong={!item.is_read} style={{ fontSize: 13 }}>{item.title}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!item.is_read && <Badge status="processing" />}
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined style={{ fontSize: 10, color: '#999' }} />}
                      style={{ padding: '0 2px', height: 16, minWidth: 16 }}
                      onClick={(e) => handleDismiss(e, item.id)}
                    />
                  </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                  {item.message}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                  {new Date(item.created_at).toLocaleString()}
                </Text>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge dot={unreadCount > 0} size="small">
        <NotificationOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#262626' }} />
      </Badge>
    </Dropdown>
  );
}
