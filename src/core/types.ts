import type { AnalyzedType } from './helpers/type-analyzer';

export interface FileInfo {
  code: string;
  analyzedTypes: AnalyzedType[];
}
