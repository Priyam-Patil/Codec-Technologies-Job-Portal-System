import sanitizeHtml from 'sanitize-html';

export const text = (value, max = 200) => typeof value === 'string' ? value.trim().slice(0, max) : '';
export const objectId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
export const statuses = ['Pending', 'Accepted', 'Rejected'];
export const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
export const workModes = ['Remote', 'Hybrid', 'Onsite'];
export const cleanHtml = value => sanitizeHtml(text(value, 50000), {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'a'],
  allowedAttributes: { a: ['href'] }, allowedSchemes: ['https', 'http', 'mailto'],
});
export function jobInput(body, partial = false) {
  const result = {};
  for (const key of ['title', 'location', 'category', 'level']) {
    if (!partial || key in body) {
      result[key] = text(body[key]);
      if (!result[key]) throw Object.assign(new Error(`${key} is required`), { status: 400 });
    }
  }
  if (!partial || 'description' in body) {
    result.description = cleanHtml(body.description);
    if (!sanitizeHtml(result.description, { allowedTags: [], allowedAttributes: {} }).trim())
      throw Object.assign(new Error('Description is required'), { status: 400 });
  }
  if (!partial || 'salary' in body) {
    const salary = body.salary;
    if (salary === '' || salary == null || !['number', 'string'].includes(typeof salary) || !Number.isFinite(Number(salary)) || Number(salary) < 0)
      throw Object.assign(new Error('Salary must be a nonnegative number'), { status: 400 });
    result.salary = Number(salary);
  }
  for (const [key, allowed] of [['jobType', jobTypes], ['workMode', workModes]]) {
    if (key in body) {
      if (!allowed.includes(body[key])) throw Object.assign(new Error(`Invalid ${key}`), { status: 400 });
      result[key] = body[key];
    }
  }
  return result;
}
