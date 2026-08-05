import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Input,
  Button,
  Space,
  Tag,
  Collapse,
  Checkbox,
  message,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import SyncDialog from '../components/SyncDialog';
import { wordDB } from '../db';
import { useSettingsStore } from '../stores/settingsStore';
import type { Word } from '../types';

const { TabPane } = Tabs;
const { Panel } = Collapse;

export default function Review() {
  const { maimemoToken } = useSettingsStore();

  const [highFreqWords, setHighFreqWords] = useState<Word[]>([]);
  const [synonymGroups, setSynonymGroups] = useState<Map<string, Word[]>>(new Map());
  const [selectedCount, setSelectedCount] = useState(0);
  const [syncDialogVisible, setSyncDialogVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allWords = await wordDB.list({ category: 'high_frequency' });
      setHighFreqWords(allWords);

      const synonymWords = await wordDB.list({ category: 'synonym' });
      const groups = new Map<string, Word[]>();
      synonymWords.forEach(word => {
        if (word.synonymGroupId) {
          if (!groups.has(word.synonymGroupId)) {
            groups.set(word.synonymGroupId, []);
          }
          groups.get(word.synonymGroupId)!.push(word);
        }
      });
      setSynonymGroups(groups);

      updateSelectedCount(allWords, synonymWords);
    } catch (error) {
      message.error('加载数据失败');
    }
  };

  const updateSelectedCount = async (highFreq: Word[], synonyms: Word[]) => {
    const allWords = [...highFreq, ...synonyms];
    const count = allWords.filter(w => w.isSelected).length;
    setSelectedCount(count);
  };

  const handleSelectAll = async () => {
    await wordDB.bulkUpdateSelected(
      highFreqWords.map(w => w.id!),
      true
    );
    await loadData();
  };

  const handleDeselectAll = async () => {
    const allWords = [...highFreqWords, ...Array.from(synonymGroups.values()).flat()];
    await wordDB.bulkUpdateSelected(
      allWords.map(w => w.id!),
      false
    );
    await loadData();
  };

  const handleWordSelect = async (wordId: number, selected: boolean) => {
    await wordDB.update(wordId, { isSelected: selected });
    await loadData();
  };

  const highFreqColumns = [
    {
      title: '',
      dataIndex: 'isSelected',
      key: 'select',
      width: 50,
      render: (isSelected: boolean, record: Word) => (
        <Checkbox
          checked={isSelected}
          onChange={(e) => handleWordSelect(record.id!, e.target.checked)}
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

  const synonymColumns = [
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

  const filteredHighFreqWords = highFreqWords.filter(word =>
    word.spelling.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Card
        title="结果预览"
        extra={
          <Space>
            <span>已选: {selectedCount} 个词</span>
            <Button onClick={handleSelectAll}>全选高频词</Button>
            <Button onClick={handleDeselectAll}>取消全选</Button>
            <Button
              type="primary"
              onClick={() => setSyncDialogVisible(true)}
              disabled={selectedCount === 0 || !maimemoToken}
            >
              同步到墨墨
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="highfreq">
          <TabPane tab="高频词" key="highfreq">
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="搜索单词"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
            </Space>
            <Table
              dataSource={filteredHighFreqWords}
              columns={highFreqColumns}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              sortDirections={['descend', 'ascend']}
            />
          </TabPane>
          <TabPane tab="同义替换" key="synonym">
            <Collapse>
              {Array.from(synonymGroups.entries()).map(([groupId, words]) => (
                <Panel
                  header={`同义替换: ${words[0].synonymMeaning || '未命名'}`}
                  key={groupId}
                >
                  <Table
                    dataSource={words}
                    columns={synonymColumns}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                </Panel>
              ))}
            </Collapse>
          </TabPane>
        </Tabs>
      </Card>

      <SyncDialog
        visible={syncDialogVisible}
        selectedCount={selectedCount}
        onClose={() => setSyncDialogVisible(false)}
        onComplete={loadData}
      />
    </div>
  );
}
