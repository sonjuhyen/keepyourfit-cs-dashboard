// 데이터 관리 - localStorage를 이용한 데이터 저장/로드

class DataManager {
    constructor() {
        this.initSampleData();
    }

    // 샘플 데이터 초기화
    initSampleData() {
        // 기존 데이터가 없으면 샘플 데이터 생성
        if (!this.getApprovedAnswers().length) {
            this.initApprovedAnswers();
        }
        if (!this.getApprovalLogs().length) {
            this.initApprovalLogs();
        }
        if (!this.getAutoRules().length) {
            this.initAutoRules();
        }
    }

    // 승인된 답변 샘플 데이터
    initApprovedAnswers() {
        const sampleAnswers = [
            {
                id: 1,
                title: "섭취법 안내",
                category: "product",
                content: "하루 2회, 아침 식후와 저녁 식후에 물과 함께 섭취해 주세요. 공복 섭취는 위장 장애를 유발할 수 있으니 피해주세요.",
                tags: ["섭취법", "복용법", "식후"],
                createdAt: "2026-04-01",
                usageCount: 15
            },
            {
                id: 2,
                title: "제품 용량 문의",
                category: "product", 
                content: "한 병당 60캡슐이 들어있으며, 하루 2캡슐 섭취 시 약 30일간 드실 수 있습니다.",
                tags: ["용량", "캡슐", "30일"],
                createdAt: "2026-03-30",
                usageCount: 8
            },
            {
                id: 3,
                title: "배송 조회 안내",
                category: "delivery",
                content: "주문번호를 알려주시면 배송 상태를 확인해드리겠습니다. 일반적으로 주문 후 1-3일 내 배송됩니다.",
                tags: ["배송", "주문번호", "배송조회"],
                createdAt: "2026-03-29",
                usageCount: 12
            },
            {
                id: 4,
                title: "환불 정책 안내",
                category: "refund",
                content: "제품에 이상이 있는 경우 7일 이내 교환/환불 가능합니다. 단순 변심은 개봉 전에 한해 가능합니다.",
                tags: ["환불", "교환", "7일"],
                createdAt: "2026-03-28",
                usageCount: 6
            }
        ];

        localStorage.setItem('approvedAnswers', JSON.stringify(sampleAnswers));
    }

    // 승인 로그 샘플 데이터
    initApprovalLogs() {
        const sampleLogs = [
            {
                id: 1,
                timestamp: "2026-04-01 14:30",
                inquiry: "섭취법이 궁금합니다. 언제 먹어야 하나요?",
                draftAnswer: "하루 2회, 아침 식후와 저녁 식후에 물과 함께 섭취해 주세요.",
                status: "approved",
                category: "product",
                rejectionReason: null
            },
            {
                id: 2,
                timestamp: "2026-04-01 13:45",
                inquiry: "한 병에 몇 개 들어있나요?",
                draftAnswer: "한 병당 60캡슐이 들어있습니다.",
                status: "approved", 
                category: "product",
                rejectionReason: null
            },
            {
                id: 3,
                timestamp: "2026-04-01 12:20",
                inquiry: "주문한 제품이 언제 오나요? 주문번호는 KYF123456입니다.",
                draftAnswer: "배송 상태를 확인해드리겠습니다. 잠시만 기다려주세요.",
                status: "rejected",
                category: "delivery",
                rejectionReason: "구체적인 주문번호 확인 필요, 에스컬레이션 요망"
            },
            {
                id: 4,
                timestamp: "2026-04-01 11:15",
                inquiry: "무료샘플 주세요!!!!!!",
                draftAnswer: "죄송하지만 현재 무료 샘플 제공은 하지 않고 있습니다.",
                status: "rejected",
                category: "general",
                rejectionReason: "스팸성 문의, 자동 차단"
            },
            {
                id: 5,
                timestamp: "2026-04-01 10:30",
                inquiry: "부작용이 있나요?",
                draftAnswer: "개인차가 있을 수 있으니 복용 전 전문가와 상담을 권장드립니다.",
                status: "pending",
                category: "product",
                rejectionReason: null
            }
        ];

        localStorage.setItem('approvalLogs', JSON.stringify(sampleLogs));
    }

    // 자동처리 규칙 샘플 데이터
    initAutoRules() {
        const sampleRules = [
            {
                id: 1,
                name: "섭취법 문의 자동 응답",
                category: "product",
                keywords: ["섭취법", "복용법", "먹는법", "언제", "시간"],
                response: "하루 2회, 아침 식후와 저녁 식후에 물과 함께 섭취해 주세요. 공복 섭취는 위장 장애를 유발할 수 있으니 피해주세요.",
                enabled: true,
                matchCount: 15
            },
            {
                id: 2,
                name: "용량 문의 자동 응답",
                category: "product",
                keywords: ["용량", "몇개", "캡슐", "알", "개수"],
                response: "한 병당 60캡슐이 들어있으며, 하루 2캡슐 섭취 시 약 30일간 드실 수 있습니다.",
                enabled: true,
                matchCount: 8
            },
            {
                id: 3,
                name: "스팸 자동 차단",
                category: "general",
                keywords: ["무료샘플", "!!!!", "공짜", "이벤트", "당첨"],
                response: "[자동차단] 스팸성 문의로 분류되었습니다.",
                enabled: true,
                matchCount: 5
            }
        ];

        localStorage.setItem('autoRules', JSON.stringify(sampleRules));
    }

    // 승인된 답변 가져오기
    getApprovedAnswers() {
        const data = localStorage.getItem('approvedAnswers');
        return data ? JSON.parse(data) : [];
    }

    // 승인된 답변 저장
    saveApprovedAnswer(answer) {
        const answers = this.getApprovedAnswers();
        if (answer.id) {
            // 기존 답변 수정
            const index = answers.findIndex(a => a.id === answer.id);
            if (index !== -1) {
                answers[index] = answer;
            }
        } else {
            // 새 답변 추가
            answer.id = Date.now();
            answer.createdAt = new Date().toISOString().split('T')[0];
            answer.usageCount = 0;
            answers.push(answer);
        }
        localStorage.setItem('approvedAnswers', JSON.stringify(answers));
        return answer;
    }

    // 승인된 답변 삭제
    deleteApprovedAnswer(id) {
        const answers = this.getApprovedAnswers();
        const filtered = answers.filter(a => a.id !== id);
        localStorage.setItem('approvedAnswers', JSON.stringify(filtered));
    }

    // 승인 로그 가져오기
    getApprovalLogs() {
        const data = localStorage.getItem('approvalLogs');
        return data ? JSON.parse(data) : [];
    }

    // 승인 로그 추가
    addApprovalLog(log) {
        const logs = this.getApprovalLogs();
        log.id = Date.now();
        log.timestamp = new Date().toLocaleString('ko-KR');
        logs.unshift(log); // 최신 순으로 정렬
        localStorage.setItem('approvalLogs', JSON.stringify(logs));
        return log;
    }

    // 자동처리 규칙 가져오기
    getAutoRules() {
        const data = localStorage.getItem('autoRules');
        return data ? JSON.parse(data) : [];
    }

    // 자동처리 규칙 저장
    saveAutoRule(rule) {
        const rules = this.getAutoRules();
        if (rule.id) {
            // 기존 규칙 수정
            const index = rules.findIndex(r => r.id === rule.id);
            if (index !== -1) {
                rules[index] = rule;
            }
        } else {
            // 새 규칙 추가
            rule.id = Date.now();
            rule.enabled = true;
            rule.matchCount = 0;
            rules.push(rule);
        }
        localStorage.setItem('autoRules', JSON.stringify(rules));
        return rule;
    }

    // 자동처리 규칙 삭제
    deleteAutoRule(id) {
        const rules = this.getAutoRules();
        const filtered = rules.filter(r => r.id !== id);
        localStorage.setItem('autoRules', JSON.stringify(filtered));
    }

    // 자동처리 규칙 토글
    toggleAutoRule(id) {
        const rules = this.getAutoRules();
        const rule = rules.find(r => r.id === id);
        if (rule) {
            rule.enabled = !rule.enabled;
            localStorage.setItem('autoRules', JSON.stringify(rules));
        }
        return rule;
    }

    // 자동처리 설정 가져오기/저장
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
        
        // 오늘 로그 필터링
        const todayLogs = logs.filter(log => log.timestamp.includes(today));
        
        // 이번주 시작일 계산
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        
        // 이번달 시작일
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        // 통계 계산
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
            avgResponseTime: "2.3분",
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

    // 카테고리별 통계
    getCategoryStats(logs) {
        const categories = ['delivery', 'refund', 'product', 'general'];
        return categories.map(cat => ({
            category: cat,
            count: logs.filter(log => log.category === cat).length,
            name: this.getCategoryName(cat)
        }));
    }

    // 카테고리 아이콘
    getCategoryIcon(category) {
        const icons = {
            delivery: '📦',
            refund: '💰',
            product: '💊',
            general: '💬'
        };
        return icons[category] || '❓';
    }

    // 카테고리 이름
    getCategoryName(category) {
        const names = {
            delivery: '배송',
            refund: '환불',
            product: '제품',
            general: '일반'
        };
        return names[category] || '기타';
    }

    // 상태 이름
    getStatusName(status) {
        const names = {
            approved: '승인',
            rejected: '거부',
            pending: '대기'
        };
        return names[status] || '알 수 없음';
    }
}

// 글로벌 인스턴스
window.dataManager = new DataManager();