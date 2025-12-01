import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { loginSchema } from '../utils/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

export const authRoutes = Router();

// Login
authRoutes.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Set session
    (req.session as any).userId = user.id;
    (req.session as any).role = user.role;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: { message: 'Invalid request' } });
  }
});

// Logout
authRoutes.post('/logout', (req, res) => {
  req.session?.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: { message: 'Logout failed' } });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// Get current user
authRoutes.get('/me', (req: AuthRequest, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: { message: 'Not authenticated' } });
  }

  res.json({
    user: {
      id: req.session.userId,
      role: req.session.role,
    },
  });
});

// Forgot password
authRoutes.post('/forgot-password', authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour validity

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, send email here
    // For now, log the token (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 Password reset token for ${email}: ${token}`);
      console.log(`Reset URL: http://localhost:3000/admin/reset-password?token=${token}`);
    }

    res.json({
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

// Reset password
authRoutes.post('/reset-password', authRateLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: { message: 'Invalid request' } });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.used ||
      resetToken.expiresAt < new Date()
    ) {
      return res.status(400).json({ error: { message: 'Invalid or expired token' } });
    }

    // Update password
    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
});

