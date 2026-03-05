import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Empty, Spin } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../api/notifications';

const { Text } = Typography;

const TYPE_COLOR = {
  info: '#1677ff',
  warning: '#faad14',
  success: '#52c41a',
  deadline: '#ff4d4f',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(countRes.data.count || 0);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id, link) => {
    try {
      await markAsRead(id);
      loadNotifications();
      if (link) { setOpen(false); navigate(link); }
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      loadNotifications();
    } catch { /* silent */ }
  };

  const menu = {
    items: [
      {
        key: 'header',
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <Text strong>Notifications</Text>
            {unreadCount > 0 && (
              <Button size="small" type="link" onClick={handleMarkAllRead}>Mark all read</Button>
            )}
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' },
      {
        key: 'list',
        label: loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
        ) : notifications.length === 0 ? (
          <Empty description="No notifications" style={{ padding: 20 }} />
        ) : (
          <List
            style={{ maxHeight: 400, overflowY: 'auto', width: 360 }}
            dataSource={notifications.slice(0, 10)}
            renderItem={(item) => (
              <List.Item
                style={{
                  cursor: item.link ? 'pointer' : 'default',
                  background: item.is_read ? 'transparent' : '#f0f7ff',
                  padding: '12px 16px',
                  borderLeft: `3px solid ${TYPE_COLOR[item.type] || '#d9d9d9'}`,
                }}
                onClick={() => handleMarkAsRead(item.id, item.link)}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong={!item.is_read}>{item.title}</Text>
                      {!item.is_read && <Badge status="processing" />}
                    </div>
                  }
                  description={
                    <>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(item.created_at).toLocaleString()}
                      </Text>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        ),
        disabled: true,
      },
    ],
  };

  return (
    <Dropdown menu={menu} trigger={['click']} open={open} onOpenChange={setOpen} placement="bottomRight">
      <Badge count={unreadCount} size="small" dot={unreadCount > 0}>
        <NotificationOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#262626' }} />
      </Badge>
    </Dropdown>
  );
}
