import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: true });

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

async function parseXmlOrThrow(res: Response) {
  const text = await res.text();
  const parsed = text.trim() ? parser.parse(text) : {};
  if (!res.ok) {
    const message = parsed?.error?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return parsed;
}

function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function serializeNode(tag: string, value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => serializeNode(tag, item)).join('');
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const attrParts: string[] = [];
    let text: string | undefined;
    let children = '';

    for (const key of Object.keys(obj)) {
      if (key.startsWith('@')) {
        attrParts.push(` ${key.slice(1)}="${escapeXml(obj[key])}"`);
      } else if (key === '#') {
        text = escapeXml(obj[key]);
      } else {
        children += serializeNode(key, obj[key]);
      }
    }

    const attrs = attrParts.join('');
    const inner = text !== undefined ? text : children;
    return inner ? `<${tag}${attrs}>${inner}</${tag}>` : `<${tag}${attrs}/>`;
  }

  if (value === undefined || value === null || value === '') {
    return `<${tag}/>`;
  }
  return `<${tag}>${escapeXml(value)}</${tag}>`;
}

function buildXml(rootTag: string, data: Record<string, unknown>) {
  return `<?xml version="1.0" encoding="UTF-8"?>${serializeNode(rootTag, data)}`;
}

interface RequestOptions {
  method?: string;
  xmlRoot?: string;
  xmlBody?: Record<string, unknown>;
  formData?: FormData;
  token?: string | null;
}

export async function apiRequest(path: string, opts: RequestOptions = {}) {
  const headers: Record<string, string> = {};
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.xmlBody && opts.xmlRoot) {
    headers['Content-Type'] = 'application/xml';
    body = buildXml(opts.xmlRoot, opts.xmlBody);
  }

  const res = await fetch(path, { method: opts.method || 'GET', headers, body });
  if (res.status === 204) return {};
  return parseXmlOrThrow(res);
}

export async function downloadFile(path: string, token: string | null, suggestedName = 'download') {
  const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new ApiError('Download failed', res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
}
