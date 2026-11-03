import { createReadStream, openSync, readSync, closeSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const path='assets/models/latif-qwen2.5-0.5b-q4_k_m.gguf';
const expectedSize=397807680;
const expectedSha256='4c5deec6759705c82c4ec59e8611383ed1c5fd1badae6fbd104fbec891480a76';
const handle=openSync(path,'r');
const bytes=Buffer.alloc(4);
try { readSync(handle,bytes,0,4,0); } finally { closeSync(handle); }
if (bytes.toString()!=='GGUF') throw new Error('Invalid GGUF file header');
const size=statSync(path).size;
if (size !== expectedSize) throw new Error(`Model size mismatch: expected ${expectedSize}, found ${size}`);
const hash=createHash('sha256');
for await (const chunk of createReadStream(path)) hash.update(chunk);
const actualSha256=hash.digest('hex');
if (actualSha256 !== expectedSha256) throw new Error(`Model SHA-256 mismatch: expected ${expectedSha256}, found ${actualSha256}`);
console.log(`GGUF header, size (${size}), and SHA-256 verified: ${actualSha256}`);
