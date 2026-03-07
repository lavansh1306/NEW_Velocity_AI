export interface KPIData {
    label: string;
    value: number | string;
    sublabel?: string;
    trend?: 'up' | 'down';
}

export interface Deadline {
    project: string;
    deadline: string;
    daysLeft: number;
    status: 'Completed' | 'At Risk' | 'Active';
}

export interface GanttMember {
    name: string;
    role: string;
    avatar: string;
    tasks: {
        name: string;
        project: string;
        startDate: string;
        endDate: string;
        status: 'track' | 'risk';
    }[];
}

export interface DashboardData {
    kpis: KPIData[];
    deadlines: Deadline[];
    gantt: GanttMember[];
    weekDates: string[];
}
