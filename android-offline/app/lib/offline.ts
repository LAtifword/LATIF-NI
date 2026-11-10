import { Asset } from 'expo-asset';
import { initLlama, type LlamaContext } from 'llama.rn';

const modelAsset = require('../assets/models/latif-qwen2.5-0.5b-q4_k_m.gguf');
let context: LlamaContext | undefined;
let initializing: Promise<LlamaContext> | undefined;

export async function getModel(): Promise<LlamaContext> {
  if (context) return context;
  if (initializing) return initializing;
  initializing = (async () => {
    const asset = Asset.fromModule(modelAsset);
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error('The bundled GGUF asset is unavailable.');
    const created = await initLlama({
      model: asset.localUri,
      n_ctx: 2048,
      n_batch: 256,
      n_threads: 2,
      n_gpu_layers: 0,
      use_mlock: false,
    });
    context = created;
    return created;
  })();
  try { return await initializing; }
  finally { initializing = undefined; }
}

export async function answerOffline(
  messages: Array<{role: 'system' | 'user' | 'assistant'; content: string}>,
  onToken: (token: string) => void,
): Promise<string> {
  const ctx = await getModel();
  const response = await ctx.completion({
    messages,
    n_predict: 256,
    temperature: 0.5,
    top_p: 0.9,
  }, (token) => onToken(token.token));
  return response.text;
}
