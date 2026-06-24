import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service';
import { LoginSchema } from './auth.validators';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate request body
    const validation = LoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      // Format validation errors for better frontend display
      const firstError = validation.error.errors[0];
      const errorMessage = firstError.message;
      res.status(422).json({ error: errorMessage });
      return;
    }

    const body = validation.data;
    const result = await authService.login(body.username, body.password);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!token) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }
    const result = await authService.refresh(token);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
