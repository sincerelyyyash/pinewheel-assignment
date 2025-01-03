
export interface Tool {
  name: string;
  input: string;
  output: string;
  idx: string;
}

export interface Agent {
  name: string;
  tools: Tool[];
  images: string[];
  output: string;
  idx: string;
}

export interface GraphData {
  timestamp: string;
  idx: string;
  query: string;
  agents: Agent[];
  response: string;
  total_tokens: number;
  is_active: boolean;
}
