/**
 * API Documentation Types
 * API 文档相关的类型定义
 */

export interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  examples: ApiExample[];
  deprecated?: boolean;
  authentication?: boolean;
}

export interface ApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description: string;
  required: boolean;
  type: string;
  format?: string;
  example?: any;
  enum?: string[];
  default?: any;
}

export interface ApiRequestBody {
  description: string;
  required: boolean;
  contentType: string;
  schema: ApiSchema;
  examples?: Record<string, ApiExample>;
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  contentType?: string;
  schema?: ApiSchema;
  examples?: Record<string, ApiExample>;
  headers?: Record<string, ApiHeader>;
}

export interface ApiSchema {
  type: string;
  properties?: Record<string, ApiProperty>;
  required?: string[];
  example?: any;
  items?: ApiSchema;
  additionalProperties?: boolean;
}

export interface ApiProperty {
  type: string;
  description?: string;
  format?: string;
  example?: any;
  enum?: string[];
  items?: ApiSchema;
  properties?: Record<string, ApiProperty>;
  required?: string[];
}

export interface ApiHeader {
  description: string;
  type: string;
  example?: string;
}

export interface ApiExample {
  name: string;
  summary?: string;
  description?: string;
  value: any;
  language?: string;
}

export interface ApiDocProps {
  endpoint: ApiEndpoint;
  showExamples?: boolean;
  interactive?: boolean;
  className?: string;
}

export interface ApiTestRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

export interface ApiTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
}

export interface CodeExample {
  language: string;
  label: string;
  code: string;
}