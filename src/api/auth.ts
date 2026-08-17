import { apiRequest } from './client';

export async function login(email: string, password: string): Promise<string> {
  const parsed = await apiRequest('/api/auth/login', {
    method: 'POST',
    xmlRoot: 'credentials',
    xmlBody: { email, password },
  });
  return parsed.session.token;
}
