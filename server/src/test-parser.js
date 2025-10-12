import { parseCode } from './src/services/codeParser.js';

const testCode = `
export class AuthService {
  async login(email, password) {
    return token;
  }
}
`;

const result = await parseCode(testCode, 'javascript');
console.log(result);