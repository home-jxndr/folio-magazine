// D1 database operations
export interface Database {
  prepare(sql: string): Statement;
  execute(sql: string): Promise<any>;
}

export interface Statement {
  bind(...values: any[]): Statement;
  run(): Promise<any>;
  all(): Promise<any>;
  get(): Promise<any>;
}
