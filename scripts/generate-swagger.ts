import { writeFileSync } from 'node:fs';
import { swaggerSpec } from '../src/interfaces/http/swagger/index.js';

writeFileSync('openapi.json', JSON.stringify(swaggerSpec, null, 2));
console.log('✓ openapi.json generated');
