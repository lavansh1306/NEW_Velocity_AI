// ==================== DASHBOARD STYLE CONSTANTS ====================

export const DASHBOARD_STYLES = {
  // ===== PAGE & CONTAINER =====
  pageContainer: 'p-12 relative min-h-screen bg-[#FAFAF9]',
  
  backgroundGradient: {
    background: 'radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.03) 0%, transparent 50%)',
    filter: 'blur(80px)',
  },

  // ===== CARDS =====
  cardBase: 'bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-[16px] p-10 shadow-sm',
  cardSmall: 'bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm',
  cardSticky: 'bg-white/70 backdrop-blur-[32px] border-[0.5px] border-[#E7E5E4] rounded-2xl p-8 shadow-sm sticky top-28',

  // ===== TYPOGRAPHY =====
  headingMain: 'text-4xl font-light text-[#1C1917] tracking-tight',
  headingSection: 'text-xl font-light text-[#1C1917]',
  label: 'text-xs font-medium text-[#78716C] uppercase tracking-wide',
  labelLight: 'text-xs text-[#A8A29E] uppercase tracking-wider font-light',
  bodyText: 'text-sm font-light text-[#78716C]',
  bodySmall: 'text-xs font-light text-[#A8A29E]',
  metricValue: 'text-3xl font-light text-[#1C1917] mb-2',
  healthScore: 'text-xl font-light text-[#0F766E]',

  // ===== BUTTONS =====
  buttonPrimary: 'bg-[#1C1917] hover:bg-[#292524] h-11 px-6 rounded-xl font-light transition-all duration-300 text-white shadow-md',
  buttonSecondary: 'border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917]',

  // ===== LAYOUT =====
  gridMain: 'grid grid-cols-12 gap-10',
  metricContainer: 'flex-1',
  divider: 'w-px h-12 bg-[#E7E5E4]',

  // ===== STATUS BADGES =====
  statusBadges: {
    active: 'bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1]',
    atRisk: 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6]',
    completed: 'bg-[#F5F5F4] text-[#57534E] border border-[#E7E5E4]',
    inProgress: 'bg-white text-[#1C1917] border border-[#E7E5E4]',
  },

  // ===== PRIORITY BADGES =====
  priorityBadges: {
    high: 'bg-[#FFF1F2] text-[#BE123C]',
    medium: 'bg-[#FFF7ED] text-[#C2410C]',
    low: 'bg-[#F0FDFA] text-[#0F766E]',
  },

  // ===== HEALTH INDICATOR =====
  healthGood: 'w-14 h-14 rounded-2xl bg-[#F0FDFA] flex items-center justify-center',
  healthAtRisk: 'w-14 h-14 rounded-2xl bg-[#FFF1F2] flex items-center justify-center',

  // ===== UTILIZATION BAR =====
  utilizationBarContainer: 'w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden',
  utilizationBarFill: 'h-full transition-all duration-500',
  utilizationBarHigh: 'bg-[#BE123C]',
  utilizationBarMedium: 'bg-[#C2410C]',
  utilizationBarLow: 'bg-[#0F766E]',

  // ===== AVATAR =====
  avatar: 'border border-[#E7E5E4]',
  avatarFallback: 'bg-[#F5F5F4] text-[#1C1917]',

  // ===== TABLE & ROWS =====
  tableHeader: 'flex items-center pb-4 border-b border-[#E7E5E4] mb-2 px-2',
  tableHeaderCell: 'text-xs text-[#A8A29E] uppercase tracking-wider font-light',
  tableRow: 'flex items-center py-3 hover:bg-white/40 transition-colors px-2 -mx-2 rounded-lg group cursor-pointer',
  allocationRow: 'py-5 px-6 hover:bg-white/60 rounded-2xl cursor-pointer transition-all duration-300',

  // ===== COLORS =====
  colors: {
    background: '#FAFAF9',
    backgroundLight: '#F5F5F4',
    text: {
      primary: '#1C1917',
      secondary: '#78716C',
      tertiary: '#A8A29E',
      light: '#D6D3D1',
    },
    border: '#E7E5E4',
    borderLight: '#F5F5F4',
    status: {
      active: '#0F766E',
      activeLight: '#CCFBF1',
      risk: '#BE123C',
      riskLight: '#FFE4E6',
      warning: '#C2410C',
      warningLight: '#FFEDD5',
    },
  },

  // ===== SPACING =====
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
  },

  // ===== COMMON COMPONENT STYLES =====
  backButton: 'flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] transition-colors group',
  backButtonArrow: 'w-4 h-4 transition-transform group-hover:-translate-x-1',

  // ===== METRIC CARD =====
  metricCardContainer: 'flex-1',
  metricCardValue: 'text-3xl font-light text-[#1C1917] mb-2',
  metricCardLabel: 'text-xs text-[#78716C] font-light',

  // ===== TASK ROW =====
  taskTitle: 'text-sm text-[#1C1917] font-medium mb-0.5',
  taskKey: 'text-xs text-[#A8A29E] font-light',
  taskAssignee: 'text-sm text-[#57534E] font-light truncate',

  // ===== TEAM MEMBER ROW =====
  memberName: 'text-sm text-[#1C1917] font-light mb-1',
  memberRole: 'text-xs text-[#A8A29E] font-light',
  memberUtilization: 'text-sm font-light',
  memberUtilizationHigh: 'text-[#BE123C]',

  // ===== AI RECOMMENDATION CARD =====
  aiCardBase: 'p-4 rounded-lg border cursor-pointer transition-all duration-300',
  aiCardSelected: 'bg-[#F0FDFA] border-[#0F766E]',
  aiCardDefault: 'bg-white border-[#E7E5E4] hover:border-[#A8A29E]',
  aiCardTitle: 'text-sm font-light text-[#1C1917] mb-2',
  aiCardMetrics: 'text-xs text-[#78716C] space-y-1 mb-3',
  aiCardProLabel: 'font-light text-[#0F766E] mb-1',
  aiCardConLabel: 'font-light text-[#C2410C] mb-1',
  aiCardBullet: 'text-[#78716C]',
};

// ===== HELPER FUNCTIONS =====

export const getStatusBadgeStyle = (status: string): string => {
  const statusMap: Record<string, keyof typeof DASHBOARD_STYLES.statusBadges> = {
    'Active': 'active',
    'At Risk': 'atRisk',
    'Completed': 'completed',
    'In Progress': 'inProgress',
  };
  
  const statusKey = statusMap[status] || 'completed';
  return DASHBOARD_STYLES.statusBadges[statusKey];
};

export const getPriorityBadgeStyle = (priority: string): string => {
  const priorityMap: Record<string, keyof typeof DASHBOARD_STYLES.priorityBadges> = {
    'High': 'high',
    'Medium': 'medium',
    'Low': 'low',
  };
  
  const priorityKey = priorityMap[priority] || 'low';
  return DASHBOARD_STYLES.priorityBadges[priorityKey];
};

export const getHealthIndicatorStyle = (score: number): { container: string; text: string } => {
  if (score >= 80) {
    return {
      container: DASHBOARD_STYLES.healthGood,
      text: DASHBOARD_STYLES.healthScore,
    };
  }
  return {
    container: DASHBOARD_STYLES.healthAtRisk,
    text: 'text-xl font-light text-[#BE123C]',
  };
};

export const getUtilizationBarColor = (utilization: number): string => {
  if (utilization > 110) return DASHBOARD_STYLES.utilizationBarHigh;
  if (utilization > 90) return DASHBOARD_STYLES.utilizationBarMedium;
  return DASHBOARD_STYLES.utilizationBarLow;
};

export const getUtilizationTextColor = (utilization: number): string => {
  if (utilization > 110) return 'text-[#BE123C]';
  return 'text-[#1C1917]';
};
