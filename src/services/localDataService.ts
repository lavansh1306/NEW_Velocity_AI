import { v4 as uuidv4 } from 'uuid';

/**
 * LocalDataService provides a localStorage-based fallback for CRUD operations.
 * This satisfies the "keep it local" and "no server" requirements.
 */

export interface LocalTask {
  id: string;
  project_id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  assignee_id?: string | null;
  created_at: string;
}

export interface LocalProject {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  created_at: string;
}

class LocalDataService {
  private STORAGE_KEYS = {
    TASKS: 'velo_local_tasks',
    PROJECTS: 'velo_local_projects',
    MEMBERS: 'velo_local_members'
  };

  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Projects ---
  async getProjects(orgId: string): Promise<LocalProject[]> {
    return this.get<LocalProject>(this.STORAGE_KEYS.PROJECTS).filter(p => p.organization_id === orgId);
  }

  async createProject(orgId: string, name: string, description?: string): Promise<LocalProject> {
    const projects = this.get<LocalProject>(this.STORAGE_KEYS.PROJECTS);
    const newProject: LocalProject = {
      id: crypto.randomUUID(),
      organization_id: orgId,
      name,
      description,
      status: 'active',
      created_at: new Date().toISOString()
    };
    this.set(this.STORAGE_KEYS.PROJECTS, [...projects, newProject]);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<LocalProject>): Promise<void> {
    const projects = this.get<LocalProject>(this.STORAGE_KEYS.PROJECTS);
    this.set(this.STORAGE_KEYS.PROJECTS, projects.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  async deleteProject(id: string): Promise<void> {
    const projects = this.get<LocalProject>(this.STORAGE_KEYS.PROJECTS);
    this.set(this.STORAGE_KEYS.PROJECTS, projects.filter(p => p.id !== id));
    // Also delete associated tasks
    const tasks = this.get<LocalTask>(this.STORAGE_KEYS.TASKS);
    this.set(this.STORAGE_KEYS.TASKS, tasks.filter(t => t.project_id !== id));
  }

  // --- Tasks ---
  async getTasks(projectId: string): Promise<LocalTask[]> {
    return this.get<LocalTask>(this.STORAGE_KEYS.TASKS).filter(t => t.project_id === projectId);
  }

  async createTask(projectId: string, name: string, assigneeId?: string | null): Promise<LocalTask> {
    const tasks = this.get<LocalTask>(this.STORAGE_KEYS.TASKS);
    const newTask: LocalTask = {
      id: crypto.randomUUID(),
      project_id: projectId,
      name,
      status: 'not_started',
      assignee_id: assigneeId,
      created_at: new Date().toISOString()
    };
    this.set(this.STORAGE_KEYS.TASKS, [...tasks, newTask]);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<LocalTask>): Promise<void> {
    const tasks = this.get<LocalTask>(this.STORAGE_KEYS.TASKS);
    this.set(this.STORAGE_KEYS.TASKS, tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = this.get<LocalTask>(this.STORAGE_KEYS.TASKS);
    this.set(this.STORAGE_KEYS.TASKS, tasks.filter(t => t.id !== id));
  }
}

export const localDataService = new LocalDataService();
