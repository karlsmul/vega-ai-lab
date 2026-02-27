import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

function getAPIKey() {
  // Check environment variable first
  if (process.env.ANTHROPIC_API_KEY) return { key: process.env.ANTHROPIC_API_KEY, provider: 'anthropic' };
  if (process.env.OPENAI_API_KEY) return { key: process.env.OPENAI_API_KEY, provider: 'openai' };

  // Check .env file
  try {
    const envFile = readFileSync(join(ROOT, '.env'), 'utf-8');
    for (const line of envFile.split('\n')) {
      const [k, ...v] = line.split('=');
      const key = k?.trim();
      const val = v.join('=').trim().replace(/^["']|["']$/g, '');
      if (key === 'ANTHROPIC_API_KEY' && val) return { key: val, provider: 'anthropic' };
      if (key === 'OPENAI_API_KEY' && val) return { key: val, provider: 'openai' };
    }
  } catch {}

  return null;
}

export async function queryAI(prompt, systemPrompt = '') {
  const creds = getAPIKey();
  if (!creds) return null;

  try {
    if (creds.provider === 'anthropic') {
      return await queryAnthropic(creds.key, prompt, systemPrompt);
    } else {
      return await queryOpenAI(creds.key, prompt, systemPrompt);
    }
  } catch (err) {
    console.warn(`  AI API error: ${err.message}`);
    return null;
  }
}

async function queryAnthropic(key, prompt, systemPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt || 'You are an AI trends and business opportunity analyst.',
      messages: [{ role: 'user', content: prompt }]
    }),
    signal: AbortSignal.timeout(60000)
  });
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

async function queryOpenAI(key, prompt, systemPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt || 'You are an AI trends and business opportunity analyst.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(60000)
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

export function hasAPIKey() {
  return getAPIKey() !== null;
}
