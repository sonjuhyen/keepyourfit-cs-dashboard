const fs = require('node:fs');
const path = require('node:path');
const { json } = require('./_lib');

module.exports = async (req, res) => {
  const approvalsDir = '/tmp/dobi-approvals';
  const learningsPath = '/Users/son/.openclaw/workspace/agents-dobi/LEARNINGS.md';

  const approvalsExists = fs.existsSync(approvalsDir);
  const files = approvalsExists ? fs.readdirSync(approvalsDir).sort() : [];
  const learningsExists = fs.existsSync(learningsPath);
  const learningsText = learningsExists ? fs.readFileSync(learningsPath, 'utf-8') : '';
  const stat = learningsExists ? fs.statSync(learningsPath) : null;

  return json(res, {
    approvals: {
      directory: approvalsDir,
      exists: approvalsExists,
      pendingCount: files.filter(name => !name.endsWith('.approved') && !name.includes('.sent.')).length,
      approvedCount: files.filter(name => name.endsWith('.approved')).length,
      sentCount: files.filter(name => name.includes('.sent.')).length,
      files,
    },
    learnings: {
      path: learningsPath,
      exists: learningsExists,
      autoReplyPatternCount: (learningsText.match(/^### 패턴:/gm) || []).length,
      spamPatternSection: learningsText.includes('## 🚫 스팸 패턴'),
      lastModifiedAt: stat ? stat.mtime.toISOString() : null,
      preview: learningsText ? learningsText.split('\n').slice(0, 20) : [],
    },
    heartbeat: {
      enabled: true,
      source: path.join('/Users/son/.openclaw/workspace/agents-dobi', 'HEARTBEAT.md'),
    },
    notes: [
      '승인 없이 고객 전송 금지',
      '승인 파일 존재 시에만 전송 가능',
      '현재 대시보드는 read-only 운영 진단 중심 1차 버전',
    ],
  });
};
