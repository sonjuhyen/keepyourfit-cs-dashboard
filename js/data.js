// 데이터 관리 - API 기반 데이터 저장/로드

class DataManager {
    constructor() {
        this.base = '/api';
        this.cache = { answers: null, logs: null, rules: null };
    }

    // === API 호출 ===

    async fetchAll() {
        const [answers, logs, rules] = await Promise.all([
            fetch(`${this.base}/answers`).then(r => r.json()),
            fetch(`${this.base}/logs`).then(r => r.json()),
            fetch(`${this.base}/rules`).then(r => r.json()),
        ]);
        this.cache = { answers, logs, rules };
        return this.cache;
    }

    // 승인된 답변
    getApprovedAnswers() {
        return this.cache.answers || [];
    }

    async saveApprovedAnswer(answer) {
        if (answer.id) {
            const res = await fetch(`${this.base}/answers/${answer.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answer)
            });
            return res.json();
        }
        answer.createdAt = new Date().toISOString().split('T')[0];
        answer.usageCount = 0;
        const res = await fetch(`${this.base}/answers`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(answer)
        });
        return res.json();
    }

    async deleteApprovedAnswer(id) {
        await fetch(`${this.base}/answers/${id}`, { method: 'DELETE' });
    }

    // 승인 로그
    getApprovalLogs() {
        return this.cache.logs || [];
    }

    async addApprovalLog(log) {
        log.timestamp = new Date().toLocaleString('ko-KR');
        const res = await fetch(`${this.base}/logs`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log)
        });
        return res.json();
    }

    // 자동처리 규칙
    getAutoRules() {
        return this.cache.rules || [];
    }

    async saveAutoRule(rule) {
        if (rule.id) {
            const res = await fetch(`${this.base}/rules/${rule.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rule)
            });
            return res.json();
        }
        rule.enabled = true;
        rule.matchCount = 0;
        const res = await fetch(`${this.base}/rules`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rule)
        });
        return res.json();
    }

    async deleteAutoRule(id) {
        await fetch(`${this.base}/rules/${id}`, { method: 'DELETE' });
    }

    async toggleAutoRule(id) {
        const rules = this.getAutoRules();
        const rule = rules.find(r => r.id === id);
        if (rule) {
            rule.enabled = !rule.enabled;
            await fetch(`${this.base}/rules/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rule)
            });
        }
        return rule;
    }

    // 자동처리 설정 (클라이언트 로컬)
    getAutoProcessingEnabled() {
        return localStorage.getItem('autoProcessingEnabled') !== 'false';
    }

    setAutoProcessingEnabled(enabled) {
        localStorage.setItem('autoProcessingEnabled', enabled.toString());
    }

    // 통계 데이터 계산
    getStats() {
        const logs = this.getApprovalLogs();
        const today = new Date().toISOString().split('T')[0];

        const todayLogs = logs.filter(log => log.timestamp.includes(today));

        const approvedToday = todayLogs.filter(log => log.status === 'approved').length;
        const totalToday = todayLogs.length;
        const autoProcessed = logs.filter(log => log.category !== 'general' && log.status === 'approved').length;
        const totalProcessed = logs.filter(log => log.status !== 'pending').length;

        return {
            today: {
                total: totalToday,
                approved: approvedToday,
                rejected: todayLogs.filter(log => log.status === 'rejected').length,
                pending: todayLogs.filter(log => log.status === 'pending').length
            },
            automation: {
                rate: totalProcessed > 0 ? Math.round((autoProcessed / totalProcessed) * 100) : 0,
                count: autoProcessed
            },
            approval: {
                rate: totalToday > 0 ? Math.round((approvedToday / totalToday) * 100) : 0,
                approved: approvedToday,
                rejected: todayLogs.filter(log => log.status === 'rejected').length,
                pending: todayLogs.filter(log => log.status === 'pending').length
            },
            avgResponseTime: this.calcAvgResponseTime(logs),
            categoryStats: this.getCategoryStats(logs),
            recentActivities: logs.slice(0, 5).map(log => ({
                id: log.id,
                icon: this.getCategoryIcon(log.category),
                title: log.inquiry.substring(0, 30) + (log.inquiry.length > 30 ? '...' : ''),
                time: log.timestamp,
                status: this.getStatusName(log.status)
            }))
        };
    }

    calcAvgResponseTime(logs) {
        const times = logs.filter(l => l.responseTime != null).map(l => l.responseTime);
        if (!times.length) return '-';
        return (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) + '분';
    }

    getCategoryStats(logs) {
        const categories = ['delivery', 'refund', 'product', 'general'];
        return categories.map(cat => ({
            category: cat,
            count: logs.filter(log => log.category === cat).length,
            name: this.getCategoryName(cat)
        }));
    }

    getCategoryIcon(category) {
        const icons = { delivery: '📦', refund: '💰', product: '💊', general: '💬' };
        return icons[category] || '❓';
    }

    getCategoryName(category) {
        const names = { delivery: '배송', refund: '환불', product: '제품', general: '일반' };
        return names[category] || '기타';
    }

    getStatusName(status) {
        const names = { approved: '승인', rejected: '거부', pending: '대기' };
        return names[status] || '알 수 없음';
    }
}

window.dataManager = new DataManager();
