import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { HTTP_STATUS } from '../constants/http.constants';

export class AuthController {
  public async validateTelegram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.validateTelegram(req.body.initData);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public async registerEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerEmail(req.body);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async loginEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.loginEmail(req.body.email, req.body.password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.googleAuth(req.body);
      const statusCode = result.user && !result.isNewUser ? HTTP_STATUS.OK : HTTP_STATUS.OK;
      res.status(statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async registerTelegram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerTelegram(req.body);
      res.status(HTTP_STATUS.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  public async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.getProfile(req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.updateProfile(req.user!.userId, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public async devLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.devLogin(req.body.role);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
