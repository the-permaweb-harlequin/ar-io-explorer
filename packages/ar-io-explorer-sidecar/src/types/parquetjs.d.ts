declare module 'parquetjs' {
  export class ParquetSchema {
    constructor(schema: Record<string, any>);
  }

  export class ParquetWriter {
    static openFile(schema: ParquetSchema, path: string, options?: any): Promise<ParquetWriter>;
    appendRow(row: any): Promise<void>;
    close(): Promise<void>;
  }

  export class ParquetReader {
    static openFile(path: string): Promise<ParquetReader>;
    getCursor(): any;
  }
}
