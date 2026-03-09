import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Space, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { forgotPassword } from '../../api/auth';
import usePageTitle from '../../hooks/usePageTitle';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  usePageTitle('Forgot Password');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const onFinish = async ({ email }) => {
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #001529 0%, #0050b3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Card style={{ width: 420, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        {sent ? (
          <Result
            status="success"
            title="Check your inbox"
            subTitle="If an account with that email exists, a password reset link has been sent. It will expire in 1 hour."
            extra={
              <Link to="/login">
                <Button type="primary" icon={<ArrowLeftOutlined />}>Back to Login</Button>
              </Link>
            }
          />
        ) : (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1677ff' }}>Forgot Password</Title>
              <Text type="secondary">Enter your email and we'll send a reset link</Text>
            </div>

            {error && (
              <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />
            )}

            <Form layout="vertical" onFinish={onFinish} autoComplete="off" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Email is required' },
                  { type: 'email',  message: 'Enter a valid email' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Your email address" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 8 }}>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Send Reset Link
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login">
                <Text><ArrowLeftOutlined /> Back to Login</Text>
              </Link>
            </div>
          </Space>
        )}
      </Card>
    </div>
  );
}
