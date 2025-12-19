import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

// ========================================
// Project list API
// ========================================

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  color: string;
}

// Fallback descriptions / images / colors / tags for projects
// These could also be stored in another CSV or metadata file
const projectDescriptions: Record<string, string> = {
  '1': 'Built an integrated inventory management and demand forecasting system for a mid-market retail chain. Reduced stockouts by 32% and optimized warehouse operations, saving $450k annually in operational overhead.',
  '2': 'Designed a multi-tenant cloud infrastructure orchestration platform enabling real-time resource allocation, auto-scaling, and cost optimization across distributed systems.',
  '3': 'Developed a comprehensive healthcare tracking platform with HIPAA compliance, real-time patient monitoring, and predictive analytics for better clinical outcomes.',
  '4': 'Built an advanced risk assessment engine for fintech with machine learning models for market volatility prediction and portfolio optimization.',
  '5': 'Optimized supply chain logistics using advanced algorithms, reducing delivery times and costs significantly.',
  '6': 'Created an enterprise HR analytics suite for workforce planning, engagement tracking, and talent management.',
};

const projectColors: Record<string, string> = {
  '1': '#d97706',
  '2': '#2563EB',
  '3': '#059669',
  '4': '#7c3aed',
  '5': '#f59e0b',
  '6': '#10b981',
};

const projectTags: Record<string, string[]> = {
  '1': ['Inventory', 'Analytics', 'Operations'],
  '2': ['Cloud', 'Infrastructure', 'DevOps'],
  '3': ['Healthcare', 'Compliance', 'Real-time'],
  '4': ['Fintech', 'AI/ML', 'Risk Analysis'],
  '5': ['Supply Chain', 'Logistics', 'Optimization'],
  '6': ['HR', 'Analytics', 'Enterprise'],
};

const projectImages: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=800&fit=crop',
  '2': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
  '3': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=800&fit=crop',
  '4': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
  '5': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop',
  '6': 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=800&fit=crop',
};

const DATA_DIR = path.resolve(process.cwd(), 'public', 'data');

interface RawProjectRow {
  id: string;
  name: string;
  category: string;
  data: string; // JSON string (unused here, but part of CSV)
}

function loadProjectsFromCSV(): ProjectItem[] {
  const filePath = path.join(DATA_DIR, 'projects-analytics.csv');
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows: RawProjectRow[] = parse(content, { columns: true, skip_empty_lines: true });

  return rows.map((row) => {
    const id = row.id ?? '';
    return {
      id,
      title: row.name ?? `Project ${id}`,
      category: row.category ?? '',
      description: projectDescriptions[id] ?? 'Project details not available.',
      image: projectImages[id] ?? 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=800&fit=crop',
      tags: projectTags[id] ?? [],
      color: projectColors[id] ?? '#6366f1',
    };
  });
}

/**
 * GET /api/projects
 * Returns a list of projects.
 */
export async function GET(): Promise<Response> {
  const projects = loadProjectsFromCSV();
  return new Response(JSON.stringify(projects), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
