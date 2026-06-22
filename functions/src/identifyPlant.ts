import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const anthropicKey = defineSecret('ANTHROPIC_API_KEY');

const PLANT_ID_PROMPT = `You are a plant identification expert. Analyze this plant image and return ONLY a valid JSON object with these exact fields:
{
  "commonName": "string (e.g. Pothos)",
  "scientificName": "string (e.g. Epipremnum aureum)",
  "wateringFrequencyDays": number (days between waterings, e.g. 7),
  "sunlight": "low" or "medium" or "high",
  "soilType": "string (e.g. Well-draining potting mix)",
  "description": "string (1-2 sentences about the plant and its care)"
}
No markdown fences. No explanation. Only the JSON object.`;

interface PlantIdResult {
  commonName: string;
  scientificName: string;
  wateringFrequencyDays: number;
  sunlight: 'low' | 'medium' | 'high';
  soilType: string;
  description: string;
}

function parsePlantResult(text: string): PlantIdResult {
  const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object in Claude response');
  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  return {
    commonName: typeof parsed.commonName === 'string' ? parsed.commonName : 'Unknown Plant',
    scientificName: typeof parsed.scientificName === 'string' ? parsed.scientificName : '',
    wateringFrequencyDays: typeof parsed.wateringFrequencyDays === 'number' ? parsed.wateringFrequencyDays : 7,
    sunlight: ['low', 'medium', 'high'].includes(parsed.sunlight as string)
      ? (parsed.sunlight as 'low' | 'medium' | 'high')
      : 'medium',
    soilType: typeof parsed.soilType === 'string' ? parsed.soilType : 'All-purpose potting mix',
    description: typeof parsed.description === 'string' ? parsed.description : '',
  };
}

export const identifyPlant = onCall(
  { secrets: [anthropicKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { storagePath } = (request.data ?? {}) as { storagePath?: string };
    if (!storagePath) {
      throw new HttpsError('invalid-argument', 'storagePath is required');
    }

    // Validate the path belongs to the authenticated user
    const uid = request.auth.uid;
    if (!storagePath.startsWith(`plants/${uid}/`)) {
      throw new HttpsError('permission-denied', 'Storage path does not belong to this user');
    }

    // Get a signed URL valid for 5 minutes
    let signedUrl: string;
    try {
      const [url] = await admin
        .storage()
        .bucket()
        .file(storagePath)
        .getSignedUrl({ action: 'read', expires: Date.now() + 5 * 60 * 1000 });
      signedUrl = url;
    } catch (err) {
      console.error('Failed to generate signed URL:', err);
      throw new HttpsError('internal', 'Failed to access plant image');
    }

    // Call Claude claude-sonnet-4-6 with vision
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey.value(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'url', url: signedUrl },
              },
              { type: 'text', text: PLANT_ID_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Claude API error ${response.status}:`, errText);
      throw new HttpsError('internal', `Plant identification service unavailable`);
    }

    const data = (await response.json()) as { content: Array<{ type: string; text: string }> };
    const text = data.content[0]?.text ?? '{}';

    try {
      return parsePlantResult(text);
    } catch (err) {
      console.error('Failed to parse Claude response:', err, 'raw text:', text);
      throw new HttpsError('internal', 'Failed to parse plant identification result');
    }
  },
);
