import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Checkbox,
} from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import SyncDialog from '../components/SyncDialog';
import { wordDB } from '../db';
import { useSettingsStore } from '../stores/settingsStore';
import type { Word } from '../types';

const { Option } = Select;

export default function Words() {
  const { maimemoToken } = useSettingsStore();

  const [words, setWords] = useState<Word[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    isSynced: 'all',
    sortBy: 'frequency',
    sortOrder: 'desc',
  });

  const [syncDialogVisible, setSyncDialogVisible] = useState(false);

  useEffect(() => {
    loadWords();
  }, [filters]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const result = await wordDB.list({
        search: filters.search || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        isSynced: filters.isSynced !== 'all' ? filters.isSynced === 'synced' : undefined,
        sortBy: filters.sortBy as any,
        sortOrder: filters.sortOrder as any,
      });
      setWords(result);
    } catch (error) {
      message.error('加载词汇失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
  };

  const handleCategoryChange = (value: string) => {
    setFilters({ ...filters, category: value });
  };

  const handleSyncStatusChange = (value: string) => {
    setFilters({ ...filters, isSynced: value });
  };

  const handleSortChange = (value: string) => {
    if (value === 'frequency_desc') {
      setFilters({ ...filters, sortBy: 'frequency', sortOrder: 'desc' });
    } else if (value === 'frequency_asc') {
      setFilters({ ...filters, sortBy: 'frequency', sortOrder: 'asc' });
    } else if (value === 'spelling') {
      setFilters({ ...filters, sortBy: 'spelling', sortOrder: 'asc' });
    } else if (value === 'createdAt') {
      setFilters({ ...filters, sortBy: 'createdAt', sortOrder: 'desc' });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的词汇');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个词汇吗？`,
      onOk: async () => {
        try {
          await wordDB.delete(selectedRowKeys);
          message.success('删除成功');
          setSelectedRowKeys([]);
          await loadWords();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'select',
      width: 50,
      render: (id: number) => (
        <Checkbox
          checked={selectedRowKeys.includes(id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, id]);
            } else {
              setSelectedRowKeys(selectedRowKeys.filter(key => key !== id));
            }
          }}
        />
      ),
    },
    {
      title: '单词',
      dataIndex: 'spelling',
      key: 'spelling',
      render: (spelling: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 16 }}>{spelling}</span>
      ),
    },
    {
      title: '释义',
      dataIndex: 'interpretation',
      key: 'interpretation',
    },
    {
      title: '助记',
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => (
        <span style={{ color: '#666' }}>{note}</span>
      ),
    },
    {
      title: '频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 80,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={category === 'high_frequency' ? 'blue' : 'green'}>
          {category === 'high_frequency' ? '高频词' : '同义替换'}
        </Tag>
      ),
    },
    {
      title: '同步状态',
      dataIndex: 'isSynced',
      key: 'isSynced',
      width: 100,
      render: (isSynced: boolean) => (
        <Tag color={isSynced ? 'success' : 'default'}>
          {isSynced ? '已同步' : '未同步'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Card title="词库管理">
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索单词"
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            value={filters.category}
            onChange={handleCategoryChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="high_frequency">高频词</Option>
            <Option value="synonym">同义替换</Option>
          </Select>
          <Select
            value={filters.isSynced}
            onChange={handleSyncStatusChange}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="synced">已同步</Option>
            <Option value="unsynced">未同步</Option>
          </Select>
          <Select
            value={`${filters.sortBy}_${filters.sortOrder}`}
            onChange={handleSortChange}
            style={{ width: 150 }}
          >
            <Option value="frequency_desc">频率↓</Option>
            <Option value="frequency_asc">频率↑</Option>
            <Option value="spelling">字母</Option>
            <Option value="createdAt">最近收录</Option>
          </Select>
        </Space>

        <Table
          dataSource={words}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 800 }}
        />

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span>已选 {selectedRowKeys.length} 个词</span>
          <Space>
            <Button
              onClick={() => setSyncDialogVisible(true)}
              disabled={selectedRowKeys.length === 0 || !maimemoToken}
            >
              批量同步选中
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteSelected}
              disabled={selectedRowKeys.length === 0}
            >
              删除选中
            </Button>
          </Space>
        </div>
      </Card>

      <SyncDialog
        visible={syncDialogVisible}
        selectedCount={selectedRowKeys.length}
        onClose={() => setSyncDialogVisible(false)}
        onComplete={loadWords}
      />
    </div>
  );
}
