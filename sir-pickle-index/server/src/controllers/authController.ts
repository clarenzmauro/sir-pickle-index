import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    username: string;
    role: string;
  };
}

// In production, this should be stored in a database with hashed passwords
const ADMIN_USERS = [
  {
    username: 'clarenzmauro',
    passwordHash: '$2b$12$ideRHjS87IofmxgAuUkAA.cnGcR6U0ZiohjjFh3nXsxWR0P/.E6AC',
    role: 'admin'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password }: LoginRequest = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required'
      } as AuthResponse);
      return;
    }

    // Find user
    const user = ADMIN_USERS.find(u => u.username === username);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      } as AuthResponse);
      return;
    }

    // Use proper bcrypt password comparison
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      } as AuthResponse);
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { 
        expiresIn: JWT_EXPIRES_IN 
      } as jwt.SignOptions
    );

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        username: user.username,
        role: user.role
      }
    } as AuthResponse);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse);
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided'
      } as AuthResponse);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        user: {
          username: decoded.username,
          role: decoded.role
        }
      } as AuthResponse);
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      } as AuthResponse);
    }

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    } as AuthResponse);
  }
}; 