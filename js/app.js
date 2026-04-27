// CS 대시보드 — Alpine.js 메인 컨트롤러
function csApp() {
  return {
    tabs: [
      { id: 'dashboard', label: '📊 대시보드' },
      { id: 'answers',   label: '💬 답변 DB' },
      { id: 'queue',     label: '📋 승인 큐' },
      { id: 'system',    label: '🩺 시스템' },
    ],
    activeTab: 'dashboard',
    loading: false,
    answersLoading: false,
    globalError: null,
    lastUpdated: null,

    // 데이터
    status: null,
    summary: null,
    queue: null,
    answers: {},
    entries: [],
    autoReplies: { logs: [], totals: {} },

    // 답변 편집 모달
    answerEditor: {
      open: false,
      original: null,
      category: '',
      keywordsRaw: '',
      threshold: 0.5,
      body: '',
      saving: false,
      error: null,
    },

    get hasAutoLogs() {
      return (this.autoReplies?.logs || []).length > 0;
    },

    async init() {
      await this.refreshAll();
      setInterval(() => this.refreshAll({ silent: true }), 60000);
    },

    async refreshAll(opts = {}) {
      if (!opts.silent) this.loading = true;
      this.globalError = null;
      try {
        const [status, summary, queue, autoReplies, logs] = await Promise.all([
          this.fetchJson('/api/status'),
          this.fetchJson('/api/summary'),
          this.fetchJson('/api/queue'),
          this.fetchJson('/api/auto-replies?days=7'),
          this.fetchJson('/api/logs?range=7'),
        ]);
        this.status = status;
        this.summary = summary;
        this.queue = queue;
        this.autoReplies = autoReplies || { logs: [], totals: {} };
        this.entries = logs?.entries || [];
        this.lastUpdated = this.formatKstTime(new Date().toISOString());
        this.$nextTick(() => {
          window.chartManager.drawWeek(summary?.week);
          window.chartManager.drawCategory(this.autoReplies.logs);
        });
        if (this.activeTab === 'answers' || Object.keys(this.answers).length === 0) {
          await this.loadAnswers();
        }
      } catch (err) {
        this.globalError = `데이터 로드 실패: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },

    async loadAnswers() {
      this.answersLoading = true;
      try {
        const res = await this.fetchJson('/api/answers');
        this.answers = res || {};
      } catch (err) {
        this.globalError = `답변 DB 로드 실패: ${err.message}`;
      } finally {
        this.answersLoading = false;
      }
    },

    openAnswerEditor(category = null) {
      if (category && this.answers[category]) {
        const a = this.answers[category];
        this.answerEditor = {
          open: true,
          original: category,
          category,
          keywordsRaw: (a.keywords || []).join(', '),
          threshold: a.confidence_threshold ?? 0.5,
          body: a.auto_reply || '',
          saving: false, error: null,
        };
      } else {
        this.answerEditor = {
          open: true, original: null, category: '',
          keywordsRaw: '', threshold: 0.5, body: '',
          saving: false, error: null,
        };
      }
    },

    async saveAnswer() {
      const e = this.answerEditor;
      e.saving = true;
      e.error = null;
      try {
        const keywords = (e.keywordsRaw || '').split(',').map(s => s.trim()).filter(Boolean);
        if (!e.category) throw new Error('카테고리는 필수');
        if (keywords.length === 0) throw new Error('트리거 키워드 1개 이상');
        if (!e.body) throw new Error('답변 본문 필수');

        const payload = {
          category: e.category,
          keywords,
          auto_reply: e.body,
          confidence_threshold: typeof e.threshold === 'number' ? e.threshold : 0.5,
        };

        let res;
        if (e.original) {
          res = await fetch(`/api/answers/${encodeURIComponent(e.original)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else {
          res = await fetch('/api/answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`HTTP ${res.status}: ${t.slice(0, 120)}`);
        }
        await this.loadAnswers();
        e.open = false;
      } catch (err) {
        e.error = err.message;
      } finally {
        e.saving = false;
      }
    },

    async deleteAnswer(category) {
      if (!confirm(`"${category}" 답변을 삭제할까요? KV에서 즉시 사라집니다.`)) return;
      try {
        const res = await fetch(`/api/answers/${encodeURIComponent(category)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await this.loadAnswers();
      } catch (err) {
        this.globalError = `삭제 실패: ${err.message}`;
      }
    },

    async fetchJson(url) {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`${url} → HTTP ${r.status}: ${t.slice(0, 120)}`);
      }
      return r.json();
    },

    formatKstTime(iso) {
      if (!iso) return '-';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    },

    formatSla(sla) {
      if (!sla || sla.avgSeconds == null) return '-';
      const s = sla.avgSeconds;
      if (s < 60) return `${s}초`;
      if (s < 3600) return `${Math.round(s / 60)}분`;
      return `${(s / 3600).toFixed(1)}시간`;
    },
  };
}
