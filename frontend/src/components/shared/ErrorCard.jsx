import { Card, Result, Button } from 'antd';

export default function ErrorCard({ message, onRetry }) {
  return (
    <Card>
      <Result
        status="error"
        title="Something went wrong"
        subTitle={message || 'An error occurred. Please try again.'}
        extra={onRetry ? <Button type="primary" onClick={onRetry}>Try Again</Button> : null}
      />
    </Card>
  );
}
