"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyPlant = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const anthropicKey = (0, params_1.defineSecret)('ANTHROPIC_API_KEY');
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
function parsePlantResult(text) {
    const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
        throw new Error('No JSON object in Claude response');
    const parsed = JSON.parse(jsonMatch[0]);
    return {
        commonName: typeof parsed.commonName === 'string' ? parsed.commonName : 'Unknown Plant',
        scientificName: typeof parsed.scientificName === 'string' ? parsed.scientificName : '',
        wateringFrequencyDays: typeof parsed.wateringFrequencyDays === 'number' ? parsed.wateringFrequencyDays : 7,
        sunlight: ['low', 'medium', 'high'].includes(parsed.sunlight)
            ? parsed.sunlight
            : 'medium',
        soilType: typeof parsed.soilType === 'string' ? parsed.soilType : 'All-purpose potting mix',
        description: typeof parsed.description === 'string' ? parsed.description : '',
    };
}
exports.identifyPlant = (0, https_1.onCall)({ secrets: [anthropicKey] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    }
    const { storagePath } = (request.data ?? {});
    if (!storagePath) {
        throw new https_1.HttpsError('invalid-argument', 'storagePath is required');
    }
    // Validate the path belongs to the authenticated user
    const uid = request.auth.uid;
    if (!storagePath.startsWith(`plants/${uid}/`)) {
        throw new https_1.HttpsError('permission-denied', 'Storage path does not belong to this user');
    }
    // Get a signed URL valid for 5 minutes
    let signedUrl;
    try {
        const [url] = await admin
            .storage()
            .bucket()
            .file(storagePath)
            .getSignedUrl({ action: 'read', expires: Date.now() + 5 * 60 * 1000 });
        signedUrl = url;
    }
    catch (err) {
        console.error('Failed to generate signed URL:', err);
        throw new https_1.HttpsError('internal', 'Failed to access plant image');
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
        throw new https_1.HttpsError('internal', `Plant identification service unavailable`);
    }
    const data = (await response.json());
    const text = data.content[0]?.text ?? '{}';
    try {
        return parsePlantResult(text);
    }
    catch (err) {
        console.error('Failed to parse Claude response:', err, 'raw text:', text);
        throw new https_1.HttpsError('internal', 'Failed to parse plant identification result');
    }
});
//# sourceMappingURL=identifyPlant.js.map