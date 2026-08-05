import { useState, useEffect } from 'react';
import { Card, Table, Tag, Empty, Button } from 'antd';
import { syncLogDB } from '../db';
import type { SyncLog } from '../types';
import dayjs from 'dayjs';

export default function History() {
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSyncLogs();
  }, []);

  const loadSyncLogs = async () => {
    setLoading(true);
    try {
      const logs = await syncLogDB.list({ limit: 50 });
      setSyncLogs(logs);
    } catch (error) {
      console.error('Failed to load sync logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSyncTypeText = (type: string) => {
    switch (type) {
      case 'full':
        return '完整同步';
      case 'notepad':
        return '云词本';
      case 'interpretation':
        return '释义';
      case 'note':
        return '助记';
      case 'plan':
        return '学习规划';
      default:
        return type;
    }
  };

  const getSyncTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'blue';
      case 'notepad':
        return 'green';
      case 'interpretation':
        return 'orange';
      case 'note':
        return 'purple';
      case 'plan':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '同步类型',
      dataIndex: 'syncType',
      key: 'syncType',
      render: (type: string) => (
        <Tag color={getSyncTypeColor(type)}>{getSyncTypeText(type)}</Tag>
      ),
    },
    {
      title: '词数',
      dataIndex: 'wordCount',
      key: 'wordCount',
    },
    {
      title: '成功',
      dataIndex: 'successCount',
      key: 'successCount',
      render: (count: number) => <span style={{ color: '#52c41a' }}>{count}</span>,
    },
    {
      title: '失败',
      dataIndex: 'failCount',
      key: 'failCount',
      render: (count: number) => (count > 0 ? <span style={{ color: '#ff4d4f' }}>{count}</span> : count),
    },
    {
      title: '云词本',
      dataIndex: 'notepadId',
      key: 'notepadId',
      render: (notepadId: string) =>
        notepadId ? (
          <Button
            type="link"
            href={`https://www.maimemo.com/notepad/detail/${notepadId}`}
            target="_blank"
          >
            查看
          </Button>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div>
      <Card
        title="同步记录"
        extra={
          <Button onClick={loadSyncLogs} loading={loading}>
            刷新
          </Button>
        }
      >
        {syncLogs.length > 0 ? (
          <Table
            dataSource={syncLogs}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        ) : (
          <Empty description="暂无同步记录" />
        )}
      </Card>
    </div>
  );
}
