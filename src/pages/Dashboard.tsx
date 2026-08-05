import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Empty, Spin } from 'antd';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStore';
import { maimemoAPI } from '../api/maimemo';
import { articleDB, wordDB } from '../db';
import type { Article } from '../types';
import dayjs from 'dayjs';

export default function Dashboard() {
  const { maimemoToken } = useSettingsStore();
  const { studyFinished, studyTotal, studyTimeMinutes, setStudyProgress } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ total: number; synced: number; pending: number }>({
    total: 0,
    synced: 0,
    pending: 0,
  });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Load word stats
        const wordStats = await wordDB.stats();
        setStats(wordStats);

        // Load recent articles
        const articles = await articleDB.list({ limit: 5 });
        setRecentArticles(articles);

        // Load study progress if token exists
        if (maimemoToken) {
          try {
            const progress = await maimemoAPI.getStudyProgress(maimemoToken);
            setStudyProgress(progress.finished, progress.total, progress.time_minutes);
          } catch (error) {
            console.error('Failed to load study progress:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [maimemoToken, setStudyProgress]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'default';
      case 'analyzing':
        return 'processing';
      case 'analyzed':
        return 'success';
      case 'synced':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded':
        return '已上传';
      case 'analyzing':
        return '分析中';
      case 'analyzed':
        return '已分析';
      case 'synced':
        return '已同步';
      default:
        return status;
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '批次名',
      dataIndex: 'batchName',
      key: 'batchName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />;
  }

  return (
    <div>
      <h1>仪表盘</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日进度"
              value={maimemoToken ? `${studyFinished}/${studyTotal}` : '-'}
              suffix={maimemoToken ? <span style={{ fontSize: 14 }}>词</span> : null}
            />
            {maimemoToken && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                学习时间: {studyTimeMinutes} 分钟
              </div>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="已收录词" value={stats.total} suffix="词" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="待同步" value={stats.pending} suffix="词" />
          </Card>
        </Col>
      </Row>

      <Card title="最近文章">
        {recentArticles.length > 0 ? (
          <Table
            dataSource={recentArticles}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty description="暂无文章，请先上传并分析文章" />
        )}
      </Card>
    </div>
  );
}
