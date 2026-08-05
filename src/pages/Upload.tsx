import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Input,
  Upload as AntUpload,
  Button,
  message,
  Progress,
  Collapse,
  Space,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { analyzeFiles, analyzeText } from '../services/analyzer';
import { useAppStore } from '../stores/appStore';
import dayjs from 'dayjs';

const { Dragger } = AntUpload;
const { TextArea } = Input;
const { Panel } = Collapse;

export default function Upload() {
  const navigate = useNavigate();
  const { isAnalyzing, analysisProgress, analysisStep } = useAppStore();

  const [batchName, setBatchName] = useState(
    `${dayjs().format('YYYY-MM-DD')} 批次`
  );
  const [fileList, setFileList] = useState<any[]>([]);
  const [pastedText, setPastedText] = useState('');

  const handleFileChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

  const handleRemove = (file: any) => {
    const newFileList = fileList.filter((item: any) => item.uid !== file.uid);
    setFileList(newFileList);
  };

  const handleAnalyze = async () => {
    if (fileList.length === 0 && !pastedText.trim()) {
      message.error('请先上传文件或粘贴文本');
      return;
    }

    try {
      let result;
      if (pastedText.trim()) {
        result = await analyzeText(pastedText.trim(), batchName);
      } else {
        const files = fileList.map((item: any) => item.originFileObj);
        result = await analyzeFiles(files, batchName);
      }

      message.success('分析完成！');
      navigate('/review');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '分析失败');
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    fileList,
    onChange: handleFileChange,
    onRemove: handleRemove,
    accept: '.pdf,.txt',
    beforeUpload: () => false, // Prevent auto upload
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>上传文章</h1>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>批次名称</label>
            <Input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="请输入批次名称"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>上传文件</label>
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 PDF 和 TXT 文件，可多选
              </p>
            </Dragger>
          </div>

          <Collapse>
            <Panel header="或粘贴文本" key="1">
              <TextArea
                rows={10}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="请粘贴英文文本内容..."
              />
            </Panel>
          </Collapse>

          <Button
            type="primary"
            size="large"
            block
            onClick={handleAnalyze}
            disabled={fileList.length === 0 && !pastedText.trim()}
            loading={isAnalyzing}
          >
            开始分析
          </Button>

          {isAnalyzing && (
            <div>
              <Progress percent={analysisProgress} />
              <p style={{ textAlign: 'center', marginTop: 8 }}>{analysisStep}</p>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}
