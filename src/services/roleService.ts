import curatedRoles from '../data/curated_roles.json';

export interface RoleInfo {
  role: string;
  skills: string[];
}

class RoleService {
  private roles: RoleInfo[] = curatedRoles;

  getRoles(): string[] {
    return this.roles.map(r => r.role);
  }

  getSkillsForRole(roleName: string): string[] {
    const role = this.roles.find(r => r.role.toLowerCase() === roleName.toLowerCase());
    return role ? role.skills : [];
  }

  searchRoles(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    return this.getRoles().filter(role => 
      role.toLowerCase().includes(lowerQuery)
    );
  }
}

export const roleService = new RoleService();
