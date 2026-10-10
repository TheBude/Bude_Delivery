import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { AuthTokenPayload } from '../types';

export function generateToken(payload: AuthTokenPayload, options?: SignOptions): string {
  const signOptions: SignOptions = {
    expiresIn: (config.jwtExpiresIn as any) || '30d',
    ...options,
  };
  return jwt.sign(payload, config.jwtSecret, signOptions);
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
