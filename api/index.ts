import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
} 