import { apiRequest, toArray } from './client';

export interface Survey {
  id: number;
  name: string;
  description: string;
}

export interface QuestionOption {
  value: string;
  label: string;
}

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'single_choice'
  | 'multiple_choice'
  | 'file_upload';

export interface Question {
  id: number;
  name: string;
  type: QuestionType;
  required: boolean;
  text: string;
  description: string;
  options: QuestionOption[];
  fileFormat?: string;
  fileMaxSize?: string;
  fileMultiple?: boolean;
}

export interface SurveyResponseRecord {
  responseId: number;
  answers: Record<string, string>;
  certificates: { id: number; filename: string }[];
  dateResponded: string;
}

// Surveys

export async function listSurveys(): Promise<Survey[]> {
  const parsed = await apiRequest('/api/surveys');
  return toArray(parsed.surveys?.survey).map((s: any) => ({
    id: Number(s['@_id']),
    name: s.name,
    description: s.description || '',
  }));
}

export async function getSurvey(id: number): Promise<Survey> {
  const parsed = await apiRequest(`/api/surveys/${id}`);
  const s = parsed.survey;
  return { id: Number(s['@_id']), name: s.name, description: s.description || '' };
}

export async function createSurvey(name: string, description: string, token: string) {
  return apiRequest('/api/surveys', {
    method: 'POST',
    xmlRoot: 'survey',
    xmlBody: { name, description },
    token,
  });
}

export async function updateSurvey(id: number, name: string, description: string, token: string) {
  return apiRequest(`/api/surveys/${id}`, {
    method: 'PUT',
    xmlRoot: 'survey',
    xmlBody: { name, description },
    token,
  });
}

export async function deleteSurvey(id: number, token: string) {
  return apiRequest(`/api/surveys/${id}`, { method: 'DELETE', token });
}

function parseQuestion(q: any): Question {
  const options = toArray(q.options?.option).map((o: any) => ({
    value: o['@_value'],
    label: typeof o === 'object' ? o['#text'] ?? '' : String(o),
  }));

  return {
    id: Number(q['@_id']),
    name: q['@_name'],
    type: q['@_type'],
    required: q['@_required'] === 'yes',
    text: q.text,
    description: q.description || '',
    options,
    fileFormat: q.file_properties?.['@_format'],
    fileMaxSize: q.file_properties
      ? `${q.file_properties['@_max_file_size']}${q.file_properties['@_max_file_size_unit']}`
      : undefined,
    fileMultiple: q.file_properties?.['@_multiple'] === 'yes',
  };
}

export async function listQuestions(surveyId: number): Promise<Question[]> {
  const parsed = await apiRequest(`/api/surveys/${surveyId}/questions`);
  return toArray(parsed.questions?.question).map(parseQuestion);
}

interface QuestionInput {
  name: string;
  type: QuestionType;
  required: boolean;
  text: string;
  description: string;
  options?: QuestionOption[];
  fileFormat?: string;
  fileMaxSize?: number;
  fileMaxSizeUnit?: string;
  fileMultiple?: boolean;
}

function questionToXmlBody(input: QuestionInput) {
  const isChoice = input.type === 'single_choice' || input.type === 'multiple_choice';
  const body: Record<string, unknown> = {
    '@name': input.name,
    '@type': isChoice ? 'choice' : input.type,
    '@required': input.required ? 'yes' : 'no',
    text: input.text,
    description: input.description,
  };

  if (isChoice) {
    body.options = {
      '@multiple': input.type === 'multiple_choice' ? 'yes' : 'no',
      option: (input.options || []).map((o) => ({ '@value': o.value, '#': o.label })),
    };
  }

  if (input.type === 'file_upload') {
    body.file_properties = {
      '@format': input.fileFormat || '.pdf',
      '@max_file_size': String(input.fileMaxSize ?? 1),
      '@max_file_size_unit': input.fileMaxSizeUnit || 'mb',
      '@multiple': input.fileMultiple ? 'yes' : 'no',
    };
  }

  return body;
}

export async function createQuestion(surveyId: number, input: QuestionInput, token: string) {
  return apiRequest(`/api/surveys/${surveyId}/questions`, {
    method: 'POST',
    xmlRoot: 'question',
    xmlBody: questionToXmlBody(input),
    token,
  });
}

export async function updateQuestion(surveyId: number, questionId: number, input: QuestionInput, token: string) {
  return apiRequest(`/api/surveys/${surveyId}/questions/${questionId}`, {
    method: 'PUT',
    xmlRoot: 'question',
    xmlBody: questionToXmlBody(input),
    token,
  });
}

export async function deleteQuestion(surveyId: number, questionId: number, token: string) {
  return apiRequest(`/api/surveys/${surveyId}/questions/${questionId}`, { method: 'DELETE', token });
}

export async function submitSurveyResponse(surveyId: number, formData: FormData) {
  return apiRequest(`/api/surveys/${surveyId}/responses`, { method: 'POST', formData });
}

export async function listResponses(
  surveyId: number,
  params: { page: number; pageSize: number; email?: string },
  token: string
): Promise<{ records: SurveyResponseRecord[]; currentPage: number; lastPage: number; totalCount: number }> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.email ? { email: params.email } : {}),
  });
  const parsed = await apiRequest(`/api/surveys/${surveyId}/responses?${query}`, { token });
  const root = parsed.question_responses;
  const records = toArray(root?.question_response).map((r: any) => {
    const { response_id, certificates, date_responded, ...rest } = r;
    return {
      responseId: Number(response_id),
      certificates: toArray(certificates?.certificate).map((c: any) => ({
        id: Number(c['@_id']),
        filename: typeof c === 'object' ? c['#text'] ?? '' : String(c),
      })),
      dateResponded: date_responded,
      answers: rest,
    };
  });

  return {
    records,
    currentPage: Number(root?.['@_current_page'] ?? 1),
    lastPage: Number(root?.['@_last_page'] ?? 1),
    totalCount: Number(root?.['@_total_count'] ?? 0),
  };
}
