/**
 * GitHub synchronization for community methodologies
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import type { Methodology } from '../types/methodology.js';

export interface GitHubSyncConfig {
  repo: string; // e.g., "qualai-community/methodologies"
  token?: string;
  localDir: string;
  autoSync: boolean;
  syncInterval?: number; // minutes
}

export class GitHubSync {
  private octokit: Octokit;
  private config: GitHubSyncConfig;
  private lastSync: Date | null = null;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(config: GitHubSyncConfig) {
    this.config = {
      autoSync: config.autoSync ?? true,
      syncInterval: config.syncInterval ?? 60, // 1 hour default
      ...config,
    };

    this.octokit = new Octokit({
      auth: config.token || process.env.GITHUB_TOKEN,
    });

    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync() {
    // Initial sync
    this.syncFromGitHub().catch(err => {
      console.error('Initial sync failed:', err);
    });

    // Schedule periodic syncs
    if (this.config.syncInterval && this.config.syncInterval > 0) {
      this.syncTimer = setInterval(() => {
        this.syncFromGitHub().catch(err => {
          console.error('Auto-sync failed:', err);
        });
      }, this.config.syncInterval * 60 * 1000);
    }
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Sync methodologies from GitHub repository
   */
  async syncFromGitHub(): Promise<{
    added: string[];
    updated: string[];
    errors: string[];
  }> {
    const [owner, repo] = this.config.repo.split('/');
    const added: string[] = [];
    const updated: string[] = [];
    const errors: string[] = [];

    try {
      console.error(`Syncing methodologies from ${this.config.repo}...`);

      // Get repository contents
      const { data: contents } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'methodologies',
      });

      if (!Array.isArray(contents)) {
        throw new Error('Methodologies directory not found or not a directory');
      }

      // Ensure local directory exists
      if (!fs.existsSync(this.config.localDir)) {
        fs.mkdirSync(this.config.localDir, { recursive: true });
      }

      // Process each methodology file
      for (const file of contents) {
        if (file.type === 'file' && file.name.endsWith('.json')) {
          try {
            await this.syncMethodologyFile(owner, repo, file.path, added, updated);
          } catch (err) {
            const error = err instanceof Error ? err.message : String(err);
            errors.push(`${file.name}: ${error}`);
            console.error(`Failed to sync ${file.name}:`, error);
          }
        }
      }

      this.lastSync = new Date();
      console.error(`Sync complete: ${added.length} added, ${updated.length} updated, ${errors.length} errors`);

      return { added, updated, errors };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error('GitHub sync failed:', error);
      throw new Error(`Failed to sync from GitHub: ${error}`);
    }
  }

  /**
   * Sync a single methodology file
   */
  private async syncMethodologyFile(
    owner: string,
    repo: string,
    filePath: string,
    added: string[],
    updated: string[]
  ): Promise<void> {
    // Get file content from GitHub
    const { data: fileData } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
    });

    if ('content' in fileData && fileData.type === 'file') {
      // Decode base64 content
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

      // Validate JSON
      let methodology: Methodology;
      try {
        methodology = JSON.parse(content);
      } catch (err) {
        throw new Error('Invalid JSON format');
      }

      // Validate methodology structure
      this.validateMethodology(methodology);

      // Check if local file exists
      const localPath = path.join(this.config.localDir, path.basename(filePath));
      const isUpdate = fs.existsSync(localPath);

      // Check version if updating
      if (isUpdate) {
        const localContent = fs.readFileSync(localPath, 'utf-8');
        const localMethodology = JSON.parse(localContent) as Methodology;

        // Only update if GitHub version is newer
        if (this.compareVersions(methodology.version, localMethodology.version) <= 0) {
          // Local version is same or newer, skip
          return;
        }
      }

      // Write to local file
      fs.writeFileSync(localPath, JSON.stringify(methodology, null, 2), 'utf-8');

      if (isUpdate) {
        updated.push(methodology.id);
      } else {
        added.push(methodology.id);
      }
    }
  }

  /**
   * Validate methodology structure
   */
  private validateMethodology(methodology: any): void {
    const required = ['id', 'name', 'version', 'author', 'category', 'description', 'stages'];

    for (const field of required) {
      if (!methodology[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(methodology.stages) || methodology.stages.length === 0) {
      throw new Error('Methodology must have at least one stage');
    }

    // Validate each stage
    for (const stage of methodology.stages) {
      if (!stage.name || !stage.description || !stage.guidance) {
        throw new Error('Each stage must have name, description, and guidance');
      }
    }

    // Validate author
    if (!methodology.author.name || !methodology.author.email) {
      throw new Error('Author must have name and email');
    }

    // Validate version format (semver)
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(methodology.version)) {
      throw new Error('Version must follow semver format (e.g., 1.0.0)');
    }
  }

  /**
   * Compare semantic versions
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    lastSync: Date | null;
    autoSyncEnabled: boolean;
    repo: string;
  } {
    return {
      lastSync: this.lastSync,
      autoSyncEnabled: this.config.autoSync,
      repo: this.config.repo,
    };
  }

  /**
   * Manually trigger sync
   */
  async forceSy

nc(): Promise<void> {
    await this.syncFromGitHub();
  }
}
