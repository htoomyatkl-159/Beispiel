import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request { authUser?: AuthenticatedUser }
  }
}

export function publicUser(user: AuthenticatedUser): Omit<AuthenticatedUser, 'status'> {
  const { status: _status, ...safe } = user;
  return safe;
}

export type AuthRequest = Request;
