import { useState } from 'react';
import { Card, Form, Input, Button, Select, message, Tag, Space } from 'antd';
import { useSettingsStore } from '../stores/settingsStore';
import { maimemoAPI } from '../api/maimemo';

const { Option } = Select;

export default function Settings() {
  const {
    maimemoToken,
    openaiApiKey,
    openaiBaseUrl,
    aiModel,
    setMaimemoToken,
    setOpenaiApiKey,
    setOpenaiBaseUrl,
    setAiModel,
  } = useSettingsStore();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    progress?: { finished: number; total: number };
  } | null>(null);

  const testConnection = async () => {
    if (!maimemoToken) {
      message.error('请先输入墨墨 Token');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const progress = await maimemoAPI.getStudyProgress(maimemoToken);
      setConnectionStatus({
        success: true,
        message: '连接成功！',
        progress,
      });
      console.log('Study progress data:', progress);
      message.success('连接成功！');
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : '连接失败',
      });
      message.error('连接失败');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>设置</h1>

      <Card title="墨墨配置" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="墨墨 Token">
            <Input.Password
              value={maimemoToken}
              onChange={(e) => setMaimemoToken(e.target.value)}
              placeholder="请输入墨墨 API Token"
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                onClick={testConnection}
                loading={testingConnection}
              >
                测试连接
              </Button>
              {connectionStatus && (
                <Tag color={connectionStatus.success ? 'success' : 'error'}>
                  {connectionStatus.message}
                  {connectionStatus.success && connectionStatus.progress && (
                    <span>
                      {' '}今日进度: {connectionStatus.progress.finished}/
                      {connectionStatus.progress.total}
                    </span>
                  )}
                </Tag>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="AI 配置">
        <Form layout="vertical">
          <Form.Item label="API Key">
            <Input.Password
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="请输入 OpenAI API Key"
            />
          </Form.Item>
          <Form.Item label="Base URL">
            <Input
              value={openaiBaseUrl}
              onChange={(e) => setOpenaiBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </Form.Item>
          <Form.Item label="AI 模型">
            <Select
              value={aiModel}
              onChange={setAiModel}
              style={{ width: '100%' }}
            >
              <Option value="gpt-4o">GPT-4o</Option>
              <Option value="gpt-4o-mini">GPT-4o Mini</Option>
              <Option value="deepseek-chat">DeepSeek Chat</Option>
              <Option value="deepseek-reasoner">DeepSeek Reasoner</Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
