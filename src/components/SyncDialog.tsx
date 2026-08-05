import { useState } from 'react';
import { Modal, Checkbox, Button, Progress, Result, Space } from 'antd';
import { useAppStore } from '../stores/appStore';
import { fullSync } from '../services/syncer';
import { useSettingsStore } from '../stores/settingsStore';
import { wordDB } from '../db';

interface SyncDialogProps {
  visible: boolean;
  selectedCount: number;
  onClose: () => void;
  onComplete: () => void;
}

export default function SyncDialog({
  visible,
  selectedCount,
  onClose,
  onComplete,
}: SyncDialogProps) {
  const { isSyncing, syncProgress, syncStep } = useAppStore();
  const { maimemoToken } = useSettingsStore();

  const [options, setOptions] = useState({
    createNotepad: true,
    addToPlan: true,
    writeInterpretation: false,
    writeNote: false,
  });

  const [syncResult, setSyncResult] = useState<{
    successCount: number;
    failCount: number;
    notepadId?: string;
  } | null>(null);

  const handleSync = async () => {
    if (!maimemoToken) {
      alert('请先在设置中配置墨墨 Token');
      return;
    }

    try {
      const selectedWords = await wordDB.getSelectedWords();
      const wordIds = selectedWords.map(w => w.id!);
      const result = await fullSync(wordIds, options);
      setSyncResult(result);
    } catch (error) {
      alert(error instanceof Error ? error.message : '同步失败');
    }
  };

  const handleClose = () => {
    setSyncResult(null);
    onClose();
    if (syncResult) {
      onComplete();
    }
  };

  return (
    <Modal
      title="同步到墨墨"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      {!syncResult ? (
        <div>
          <p style={{ marginBottom: 16 }}>
            已选择 <strong>{selectedCount}</strong> 个词进行同步
          </p>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox
              checked={options.createNotepad}
              onChange={(e) => setOptions({ ...options, createNotepad: e.target.checked })}
            >
              创建云词本
            </Checkbox>
            <Checkbox
              checked={options.addToPlan}
              onChange={(e) => setOptions({ ...options, addToPlan: e.target.checked })}
            >
              加入学习规划
            </Checkbox>
            <Checkbox
              checked={options.writeInterpretation}
              onChange={(e) => setOptions({ ...options, writeInterpretation: e.target.checked })}
            >
              写入释义
            </Checkbox>
            <Checkbox
              checked={options.writeNote}
              onChange={(e) => setOptions({ ...options, writeNote: e.target.checked })}
            >
              写入助记
            </Checkbox>
          </Space>

          {isSyncing ? (
            <div style={{ marginTop: 24 }}>
              <Progress percent={syncProgress} />
              <p style={{ textAlign: 'center', marginTop: 8 }}>{syncStep}</p>
            </div>
          ) : (
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Button onClick={handleClose}>取消</Button>
              <Button type="primary" onClick={handleSync} style={{ marginLeft: 8 }}>
                开始同步
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Result
          status="success"
          title="同步完成"
          subTitle={`成功同步 ${syncResult.successCount} 个词，失败 ${syncResult.failCount} 个词`}
          extra={[
            syncResult.notepadId && (
              <Button
                key="notepad"
                type="link"
                href={`https://www.maimemo.com/notepad/detail/${syncResult.notepadId}`}
                target="_blank"
              >
                在墨墨中查看云词本
              </Button>
            ),
            <Button key="complete" type="primary" onClick={handleClose}>
              完成
            </Button>,
          ]}
        />
      )}
    </Modal>
  );
}
