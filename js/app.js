// 메인 애플리케이션 로직 - Alpine.js를 이용한 상태 관리

function csApp() {
    return {
        // 상태
        activeTab: 'dashboard',
        currentDate: new Date().toLocaleDateString('ko-KR'),
        loading: false,
        
        // 통계 데이터
        stats: {},
        recentActivities: [],
        showAllActivities: false,
        dataSource: 'local',
        lastUpdated: null,
        
        // 답변 관리
        approvedAnswers: [],
        searchTerm: '',
        selectedCategory: '',
        showNewAnswerModal: false,
        showAllAnswers: false,
        editingAnswer: null,
        newAnswer: {
            title: '',
            category: '',
            content: '',
            tagsInput: '',
            tags: []
        },
        
        // 승인 로그
        approvalLogs: [],
        logDateFilter: '',
        logStatusFilter: '',
        showAllLogs: false,
        
        // 자동처리 규칙
        autoRules: [],
        autoProcessingEnabled: true,
        showNewRuleModal: false,
        showAllRules: false,
        editingRule: null,
        newRule: {
            name: '',
            category: '',
            keywordsInput: '',
            keywords: [],
            response: ''
        },

        // 초기화
        async init() {
            await dataManager.loadLiveData();
            this.loadData();
            this.autoProcessingEnabled = dataManager.getAutoProcessingEnabled();
            
            // 창 크기 변경 시 차트 리사이즈
            window.addEventListener('resize', () => {
                setTimeout(() => chartManager.resizeCharts(), 100);
            });

            // 탭 변경 시 차트 초기화
            this.$watch('activeTab', (newTab) => {
                if (newTab === 'dashboard') {
                    setTimeout(() => chartManager.initCharts(this.stats), 100);
                }
            });
        },

        // 데이터 로드
        loadData() {
            this.loading = true;
            
            try {
                // 통계 데이터
                this.stats = dataManager.getStats();
                this.recentActivities = this.stats.recentActivities;
                
                // 승인된 답변 (expanded 속성 추가)
                this.approvedAnswers = dataManager.getApprovedAnswers().map(answer => ({
                    ...answer,
                    expanded: false
                }));
                
                // 승인 로그 (expanded 속성 추가)
                this.approvalLogs = dataManager.getApprovalLogs().map(log => ({
                    ...log,
                    expanded: false
                }));
                
                // 자동처리 규칙 (expanded 속성 추가)
                this.autoRules = dataManager.getAutoRules().map(rule => ({
                    ...rule,
                    expanded: false
                }));
                
                // 데이터 소스 표시
                this.dataSource = this.stats.dataSource || 'local';
                this.lastUpdated = this.stats.lastUpdated || null;

                // 차트 초기화 (대시보드가 활성화된 경우)
                if (this.activeTab === 'dashboard') {
                    setTimeout(() => chartManager.initCharts(this.stats), 100);
                }

            } catch (error) {
                console.error('데이터 로드 실패:', error);
                alert('데이터를 불러오는 중 오류가 발생했습니다.');
            } finally {
                this.loading = false;
            }
        },

        // 데이터 새로고침
        async refreshData() {
            await dataManager.loadLiveData();
            this.loadData();
            const src = this.dataSource === 'live' ? '실시간 데이터' : '로컬 데이터';
            alert(`${src}로 새로고침 완료! 🦦`);
        },

        // === 답변 관리 ===

        // 필터된 답변 목록
        get filteredAnswers() {
            let filtered = this.approvedAnswers;
            
            // 검색어 필터
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                filtered = filtered.filter(answer => 
                    answer.title.toLowerCase().includes(term) ||
                    answer.content.toLowerCase().includes(term) ||
                    answer.tags.some(tag => tag.toLowerCase().includes(term))
                );
            }
            
            // 카테고리 필터
            if (this.selectedCategory) {
                filtered = filtered.filter(answer => answer.category === this.selectedCategory);
            }
            
            return filtered;
        },

        // 새 답변 추가 모달 열기
        openNewAnswerModal() {
            this.showNewAnswerModal = true;
            this.editingAnswer = null;
            this.resetNewAnswer();
        },

        // 새 답변 추가 모달 닫기
        closeNewAnswerModal() {
            this.showNewAnswerModal = false;
            this.editingAnswer = null;
            this.resetNewAnswer();
        },

        // 새 답변 폼 리셋
        resetNewAnswer() {
            this.newAnswer = {
                title: '',
                category: '',
                content: '',
                tagsInput: '',
                tags: []
            };
        },

        // 답변 편집
        editAnswer(answer) {
            this.editingAnswer = answer;
            this.newAnswer = {
                ...answer,
                tagsInput: answer.tags.join(', ')
            };
            this.showNewAnswerModal = true;
        },

        // 새 답변 저장
        saveNewAnswer() {
            try {
                // 태그 처리
                this.newAnswer.tags = this.newAnswer.tagsInput
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);

                // 편집 중인 답변이 있으면 ID 설정
                if (this.editingAnswer) {
                    this.newAnswer.id = this.editingAnswer.id;
                }

                // 저장
                dataManager.saveApprovedAnswer({ ...this.newAnswer });
                
                // 데이터 새로고침
                this.loadData();
                
                // 모달 닫기
                this.closeNewAnswerModal();
                
                alert(this.editingAnswer ? '답변이 수정되었습니다! 🦦' : '새 답변이 추가되었습니다! 🦦');
                
            } catch (error) {
                console.error('답변 저장 실패:', error);
                alert('답변 저장 중 오류가 발생했습니다.');
            }
        },

        // 답변 삭제
        deleteAnswer(answerId) {
            if (confirm('정말로 이 답변을 삭제하시겠습니까?')) {
                try {
                    dataManager.deleteApprovedAnswer(answerId);
                    this.loadData();
                    alert('답변이 삭제되었습니다.');
                } catch (error) {
                    console.error('답변 삭제 실패:', error);
                    alert('답변 삭제 중 오류가 발생했습니다.');
                }
            }
        },

        // === 승인 로그 ===

        // 필터된 로그 목록
        get filteredLogs() {
            let filtered = this.approvalLogs;
            
            // 날짜 필터
            if (this.logDateFilter) {
                filtered = filtered.filter(log => log.timestamp.includes(this.logDateFilter));
            }
            
            // 상태 필터
            if (this.logStatusFilter) {
                filtered = filtered.filter(log => log.status === this.logStatusFilter);
            }
            
            return filtered;
        },

        // === 자동처리 규칙 ===

        // 자동처리 토글
        toggleAutoProcessing() {
            dataManager.setAutoProcessingEnabled(this.autoProcessingEnabled);
            alert(this.autoProcessingEnabled ? '자동처리가 활성화되었습니다! 🤖' : '자동처리가 비활성화되었습니다.');
        },

        // 새 규칙 추가 모달 열기
        openNewRuleModal() {
            this.showNewRuleModal = true;
            this.editingRule = null;
            this.resetNewRule();
        },

        // 새 규칙 추가 모달 닫기
        closeNewRuleModal() {
            this.showNewRuleModal = false;
            this.editingRule = null;
            this.resetNewRule();
        },

        // 새 규칙 폼 리셋
        resetNewRule() {
            this.newRule = {
                name: '',
                category: '',
                keywordsInput: '',
                keywords: [],
                response: ''
            };
        },

        // 규칙 편집
        editRule(rule) {
            this.editingRule = rule;
            this.newRule = {
                ...rule,
                keywordsInput: rule.keywords.join(', ')
            };
            this.showNewRuleModal = true;
        },

        // 새 규칙 저장
        saveNewRule() {
            try {
                // 키워드 처리
                this.newRule.keywords = this.newRule.keywordsInput
                    .split(',')
                    .map(keyword => keyword.trim())
                    .filter(keyword => keyword.length > 0);

                // 편집 중인 규칙이 있으면 ID 설정
                if (this.editingRule) {
                    this.newRule.id = this.editingRule.id;
                    this.newRule.enabled = this.editingRule.enabled;
                    this.newRule.matchCount = this.editingRule.matchCount;
                }

                // 저장
                dataManager.saveAutoRule({ ...this.newRule });
                
                // 데이터 새로고침
                this.loadData();
                
                // 모달 닫기
                this.closeNewRuleModal();
                
                alert(this.editingRule ? '규칙이 수정되었습니다! 🦦' : '새 규칙이 추가되었습니다! 🦦');
                
            } catch (error) {
                console.error('규칙 저장 실패:', error);
                alert('규칙 저장 중 오류가 발생했습니다.');
            }
        },

        // 규칙 토글
        toggleRule(ruleId) {
            try {
                const rule = dataManager.toggleAutoRule(ruleId);
                this.loadData();
                alert(`규칙이 ${rule.enabled ? '활성화' : '비활성화'}되었습니다.`);
            } catch (error) {
                console.error('규칙 토글 실패:', error);
                alert('규칙 상태 변경 중 오류가 발생했습니다.');
            }
        },

        // 규칙 삭제
        deleteRule(ruleId) {
            if (confirm('정말로 이 규칙을 삭제하시겠습니까?')) {
                try {
                    dataManager.deleteAutoRule(ruleId);
                    this.loadData();
                    alert('규칙이 삭제되었습니다.');
                } catch (error) {
                    console.error('규칙 삭제 실패:', error);
                    alert('규칙 삭제 중 오류가 발생했습니다.');
                }
            }
        },

        // === 유틸리티 함수 ===

        // 카테고리 이름
        getCategoryName(category) {
            return dataManager.getCategoryName(category);
        },

        // 카테고리 색상 
        getCategoryColor(category) {
            const colors = {
                delivery: 'bg-red-100 text-red-800',
                refund: 'bg-blue-100 text-blue-800', 
                product: 'bg-green-100 text-green-800',
                general: 'bg-gray-100 text-gray-800'
            };
            return colors[category] || 'bg-gray-100 text-gray-800';
        },

        // 상태 이름
        getStatusName(status) {
            return dataManager.getStatusName(status);
        },

        // 상태 색상
        getStatusColor(status) {
            const colors = {
                approved: 'bg-green-100 text-green-800',
                rejected: 'bg-red-100 text-red-800',
                pending: 'bg-yellow-100 text-yellow-800'
            };
            return colors[status] || 'bg-gray-100 text-gray-800';
        }
    };
}