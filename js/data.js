// 데이터 관리 — stats.json 연동 + localStorage 폴백

class DataManager {
    constructor() {
        this.liveData = null;
        this.dataLoaded = false;
    }

    async loadLiveData() {
        try {
            const res = await fetch('data/stats.json?' + Date.now());
            if (res.ok) {
                this.liveData = await res.json();
                this.dataLoaded = true;
                this._syncToLocalStorage();
                return true;
            }
        } catch (e) {
            console.warn('stats.json 로드 실패, localStorage 폴백:', e);
        }
        this._initFallbackData();
        return false;
    }

    _syncToLocalStorage() {
        if (!this.liveData) return;

        const { approvals, learnings, spam } = this.liveData;

        if (approvals?.logs?.length) {
            const logs = approvals.logs.map((log, i) => ({
                id: i + 1,
                timestamp: log.timestamp || '',
                inquiry: log.customer || log.draftKey || '',
                draftAnswer: '',
                status: log.status === 'sent' ? 'approved' : log.status,
                category: 'general',
                chatId: log.chatId || log.draftKey,
                rejectionReason: null
            }));
            localStorage.setItem('approvalLogs', JSON.stringify(logs));
        }

        if (learnings?.patterns?.length) {
            const answers = learnings.patterns.map((p, i) => ({
                id: i + 1,
                title: p.title || '',
                category: 'product',
                content: p.answer || '',
                tags: p.trigger ? p.trigger.split('/').map(t => t.trim().replace(/"/g, '')) : [],
                createdAt: p.approvalDate || '',
                usageCount: p.hitCount || 0,
                approver: p.approver || ''
            }));
            localStorage.setItem('approvedAnswers', JSON.stringify(answers));
        }

        if (spam?.keywords?.length) {
            localStorage.setItem('spamKeywords', JSON.stringify(spam.keywords));
        }
    }

    _initFallbackData() {
        if (!this.getApprovedAnswers().length) this._initSampleAnswers();
        if (!this.getApprovalLogs().length) this._initSampleLogs();
        if (!this.getAutoRules().length) this._initSampleRules();
    }

    _initSampleAnswers() {
        localStorage.setItem('approvedAnswers', JSON.stringify([
            { id: 1, title: "섭취법 안내", category: "product", content: "하루 2회, 아침 식후와 저녁 식후에 물과 함께 섭취해 주세요.", tags: ["섭취법", "복용법"], createdAt: "2026-04-01", usageCount: 0 },
            { id: 2, title: "배송 조회 안내", category: "delivery", content: "주문번호를 알려주시면 배송 상태를 확인해드리겠습니다. 일반적으로 주문 후 1-3일 내 배송됩니다.", tags: ["배송", "주문번호"], createdAt: "2026-04-01", usageCount: 0 }
        ]));
    }

    _initSampleLogs() {
        localStorage.setItem('approvalLogs', JSON.stringify([]));
    }

    _initSampleRules() {
        localStorage.setItem('autoRules', JSON.stringify([]));
    }

    getApprovedAnswers() {
        return JSON.parse(localStorage.getItem('approvedAnswers') || '[]');
    }

    saveApprovedAnswer(answer) {
        const answers = this.getApprovedAnswers();
        if (answer.id) {
            const index = answers.findIndex(a => a.id === answer.id);
            if (index !== -1) answers[index] = answer;
        } else {
            answer.id = Date.now();
            answer.createdAt = new Date().toISOString().split('T')[0];
            answer.usageCount = 0;
            answers.push(answer);
        }
        localStorage.setItem('approvedAnswers', JSON.stringify(answers));
        return answer;
    }

    deleteApprovedAnswer(id) {
        const answers = this.getApprovedAnswers().filter(a => a.id !== id);
        localStorage.setItem('approvedAnswers', JSON.stringify(answers));
    }

    getApprovalLogs() {
        return JSON.parse(localStorage.getItem('approvalLogs') || '[]');
    }

    addApprovalLog(log) {
        const logs = this.getApprovalLogs();
        log.id = Date.now();
        log.timestamp = new Date().toLocaleString('ko-KR');
        logs.unshift(log);
        localStorage.setItem('approvalLogs', JSON.stringify(logs));
        return log;
    }

    getAutoRules() {
        return JSON.parse(localStorage.getItem('autoRules') || '[]');
    }

    saveAutoRule(rule) {
        const rules = this.getAutoRules();
        if (rule.id) {
            const index = rules.findIndex(r => r.id === rule.id);
            if (index !== -1) rules[index] = rule;
        } else {
            rule.id = Date.now();
            rule.enabled = true;
            rule.matchCount = 0;
            rules.push(rule);
        }
        localStorage.setItem('autoRules', JSON.stringify(rules));
        return rule;
    }

    deleteAutoRule(id) {
        const rules = this.getAutoRules().filter(r => r.id !== id);
        localStorage.setItem('autoRules', JSON.stringify(rules));
    }

    toggleAutoRule(id) {
        const rules = this.getAutoRules();
        const rule = rules.find(r => r.id === id);
        if (rule) {
            rule.enabled = !rule.enabled;
            localStorage.setItem('autoRules', JSON.stringify(rules));
        }
        return rule;
    }

    getAutoProcessingEnabled() {
        return localStorage.getItem('autoProcessingEnabled') !== 'false';
    }

    setAutoProcessingEnabled(enabled) {
        localStorage.setItem('autoProcessingEnabled', enabled.toString());
    }

    getSpamKeywords() {
        return JSON.parse(localStorage.getItem('spamKeywords') || '[]');
    }

    getStats() {
        const logs = this.getApprovalLogs();
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(log => (log.timestamp || '').includes(today));

        const approved = todayLogs.filter(l => l.status === 'approved' || l.status === 'sent').length;
        const rejected = todayLogs.filter(l => l.status === 'rejected').length;
        const pending = todayLogs.filter(l => l.status === 'pending').length;

        const allApproved = logs.filter(l => l.status === 'approved' || l.status === 'sent').length;
        const allProcessed = logs.filter(l => l.status !== 'pending').length;

        return {
            today: { total: todayLogs.length, approved, rejected, pending },
            automation: {
                rate: allProcessed > 0 ? Math.round((allApproved / allProcessed) * 100) : 0,
                count: allApproved
            },
            approval: { rate: todayLogs.length > 0 ? Math.round((approved / todayLogs.length) * 100) : 0, approved, rejected, pending },
            avgResponseTime: this.liveData?.meta ? "실시간" : "—",
            categoryStats: this._getCategoryStats(logs),
            recentActivities: logs.slice(0, 10).map(log => ({
                id: log.id,
                icon: this._getCategoryIcon(log.category),
                title: (log.inquiry || log.chatId || '').substring(0, 40),
                time: log.timestamp,
                status: this.getStatusName(log.status)
            })),
            dataSource: this.dataLoaded ? 'live' : 'local',
            lastUpdated: this.liveData?.meta?.generatedAt || null,
            learningsCount: this.liveData?.learnings?.patternCount || 0,
            spamKeywordCount: this.liveData?.spam?.keywordCount || 0
        };
    }

    _getCategoryStats(logs) {
        const categories = ['delivery', 'refund', 'product', 'general'];
        return categories.map(cat => ({
            category: cat,
            count: logs.filter(log => log.category === cat).length,
            name: this.getCategoryName(cat)
        }));
    }

    _getCategoryIcon(category) {
        return { delivery: '📦', refund: '💰', product: '💊', general: '💬' }[category] || '❓';
    }

    getCategoryName(category) {
        return { delivery: '배송', refund: '환불', product: '제품', general: '일반' }[category] || '기타';
    }

    getStatusName(status) {
        return { approved: '승인', rejected: '거부', pending: '대기', sent: '전송완료' }[status] || '알 수 없음';
    }
}

window.dataManager = new DataManager();
