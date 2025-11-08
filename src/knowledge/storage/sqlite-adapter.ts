/**
 * SQLite storage adapter for Knowledge Graph
 */

import Database from 'better-sqlite3';
import { Entity, Relation, KnowledgeGraph } from '../../types/entities.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export class SQLiteAdapter {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Use environment variable or home directory for data storage
    const dataDir = process.env.QUALAI_DATA_DIR || path.join(os.homedir(), '.qualai');
    const defaultPath = path.join(dataDir, 'knowledge.db');
    const actualPath = dbPath || defaultPath;

    // Ensure directory exists
    const dir = path.dirname(actualPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(actualPath);
    this.initialize();
  }

  private initialize() {
    // Create entities table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        name TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        observations TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_entity_type ON entities(entity_type);
    `);

    // Create relations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_entity TEXT NOT NULL,
        to_entity TEXT NOT NULL,
        relation_type TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_entity) REFERENCES entities(name) ON DELETE CASCADE,
        FOREIGN KEY (to_entity) REFERENCES entities(name) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_from_entity ON relations(from_entity);
      CREATE INDEX IF NOT EXISTS idx_to_entity ON relations(to_entity);
      CREATE INDEX IF NOT EXISTS idx_relation_type ON relations(relation_type);
    `);

    // Create graph metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS graph_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // Entity operations
  createEntity(entity: Entity): void {
    const stmt = this.db.prepare(`
      INSERT INTO entities (name, entity_type, observations, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      entity.name,
      entity.entityType,
      JSON.stringify(entity.observations),
      entity.metadata ? JSON.stringify(entity.metadata) : null
    );
  }

  getEntity(name: string): Entity | null {
    const stmt = this.db.prepare('SELECT * FROM entities WHERE name = ?');
    const row = stmt.get(name) as any;

    if (!row) return null;

    return {
      name: row.name,
      entityType: row.entity_type,
      observations: JSON.parse(row.observations),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  getAllEntities(): Entity[] {
    const stmt = this.db.prepare('SELECT * FROM entities ORDER BY created_at DESC');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      name: row.name,
      entityType: row.entity_type,
      observations: JSON.parse(row.observations),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  getEntitiesByType(entityType: string): Entity[] {
    const stmt = this.db.prepare('SELECT * FROM entities WHERE entity_type = ? ORDER BY created_at DESC');
    const rows = stmt.all(entityType) as any[];

    return rows.map(row => ({
      name: row.name,
      entityType: row.entity_type,
      observations: JSON.parse(row.observations),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  updateEntity(name: string, updates: Partial<Entity>): void {
    const entity = this.getEntity(name);
    if (!entity) throw new Error(`Entity ${name} not found`);

    const updatedEntity = { ...entity, ...updates };

    const stmt = this.db.prepare(`
      UPDATE entities
      SET entity_type = ?, observations = ?, metadata = ?, updated_at = datetime('now')
      WHERE name = ?
    `);

    stmt.run(
      updatedEntity.entityType,
      JSON.stringify(updatedEntity.observations),
      updatedEntity.metadata ? JSON.stringify(updatedEntity.metadata) : null,
      name
    );
  }

  deleteEntity(name: string): void {
    const stmt = this.db.prepare('DELETE FROM entities WHERE name = ?');
    stmt.run(name);
  }

  addObservation(entityName: string, observation: string): void {
    const entity = this.getEntity(entityName);
    if (!entity) throw new Error(`Entity ${entityName} not found`);

    entity.observations.push(observation);

    const stmt = this.db.prepare(`
      UPDATE entities
      SET observations = ?, updated_at = datetime('now')
      WHERE name = ?
    `);

    stmt.run(JSON.stringify(entity.observations), entityName);
  }

  // Relation operations
  createRelation(relation: Relation): void {
    const stmt = this.db.prepare(`
      INSERT INTO relations (from_entity, to_entity, relation_type, metadata)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      relation.from,
      relation.to,
      relation.relationType,
      relation.metadata ? JSON.stringify(relation.metadata) : null
    );
  }

  getRelations(entityName?: string, relationType?: string): Relation[] {
    let query = 'SELECT * FROM relations WHERE 1=1';
    const params: any[] = [];

    if (entityName) {
      query += ' AND (from_entity = ? OR to_entity = ?)';
      params.push(entityName, entityName);
    }

    if (relationType) {
      query += ' AND relation_type = ?';
      params.push(relationType);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      from: row.from_entity,
      to: row.to_entity,
      relationType: row.relation_type,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  deleteRelation(from: string, to: string, relationType: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM relations
      WHERE from_entity = ? AND to_entity = ? AND relation_type = ?
    `);
    stmt.run(from, to, relationType);
  }

  // Graph operations
  getFullGraph(): KnowledgeGraph {
    const entities = this.getAllEntities();
    const relations = this.getRelations();

    const metadata = this.getGraphMetadata();

    return {
      entities,
      relations,
      metadata,
    };
  }

  clearGraph(): void {
    this.db.exec('DELETE FROM relations');
    this.db.exec('DELETE FROM entities');
    this.db.exec('DELETE FROM graph_metadata');
  }

  // Metadata operations
  setGraphMetadata(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO graph_metadata (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
    `);
    stmt.run(key, value, value);
  }

  getGraphMetadata(): Record<string, string> {
    const stmt = this.db.prepare('SELECT key, value FROM graph_metadata');
    const rows = stmt.all() as any[];

    const metadata: Record<string, string> = {};
    for (const row of rows) {
      metadata[row.key] = row.value;
    }

    return metadata;
  }

  // Search operations
  searchEntities(query: string): Entity[] {
    const stmt = this.db.prepare(`
      SELECT * FROM entities
      WHERE name LIKE ? OR observations LIKE ?
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const searchPattern = `%${query}%`;
    const rows = stmt.all(searchPattern, searchPattern) as any[];

    return rows.map(row => ({
      name: row.name,
      entityType: row.entity_type,
      observations: JSON.parse(row.observations),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  // Statistics
  getStatistics() {
    const entityCount = this.db.prepare('SELECT COUNT(*) as count FROM entities').get() as any;
    const relationCount = this.db.prepare('SELECT COUNT(*) as count FROM relations').get() as any;

    const entityTypeStats = this.db.prepare(`
      SELECT entity_type, COUNT(*) as count
      FROM entities
      GROUP BY entity_type
      ORDER BY count DESC
    `).all() as any[];

    const relationTypeStats = this.db.prepare(`
      SELECT relation_type, COUNT(*) as count
      FROM relations
      GROUP BY relation_type
      ORDER BY count DESC
    `).all() as any[];

    return {
      totalEntities: entityCount.count,
      totalRelations: relationCount.count,
      entitiesByType: entityTypeStats,
      relationsByType: relationTypeStats,
    };
  }

  close(): void {
    this.db.close();
  }
}
