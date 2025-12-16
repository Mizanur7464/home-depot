import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import axios from 'axios';

// Middleware to verify WHOP authentication
export async function verifyWHOPAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // Verify token with WHOP API
    try {
      const userResponse = await axios.get('https://api.whop.com/api/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const whopUser = userResponse.data;
      const whopUserId = whopUser.id;

      // Check membership status
      const membershipResponse = await axios.get(
        `https://api.whop.com/api/v2/memberships/${whopUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const membershipActive = membershipResponse.data?.status === 'active';

      if (!membershipActive) {
        return res.status(403).json({ error: 'Membership not active' });
      }

      // Update or create user in database
      await User.findOneAndUpdate(
        { whop_user_id: whopUserId },
        {
          whop_user_id: whopUserId,
          email: whopUser.email || whopUser.username,
          membership_active: membershipActive,
          last_checked_at: new Date(),
          updated_at: new Date(),
        },
        { upsert: true, new: true }
      );

      // Attach user info to request
      (req as any).user = { 
        whop_user_id: whopUserId,
        email: whopUser.email || whopUser.username,
        membership_active: membershipActive
      };
      next();
    } catch (whopError: any) {
      console.error('WHOP API verification failed:', whopError.message);
      
      // Fallback: Check database if WHOP API fails
      const whopUserId = req.headers['x-whop-user-id'] as string;
      if (whopUserId) {
        const user = await User.findOne({ whop_user_id: whopUserId });
        if (user && user.membership_active) {
          (req as any).user = { whop_user_id: whopUserId };
          return next();
        }
      }
      
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Admin middleware (for admin routes)
export async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // First verify WHOP authentication
  // If verifyWHOPAuth passes, user is authenticated and has active membership
  // Additional admin role check can be added here if needed
  
  // Wrap verifyWHOPAuth to add admin check
  const originalNext = next;
  const adminNext = () => {
    // Check if user is admin (if admin role system is implemented)
    const user = (req as any).user;
    
    // For now, all authenticated WHOP members with active membership can access admin
    // TODO: Add admin role check in User model if needed
    // Example: if (user.role !== 'admin') { return res.status(403).json({ error: 'Admin access required' }); }
    
    originalNext();
  };
  
  // Call verifyWHOPAuth with modified next function
  await verifyWHOPAuth(req, res, adminNext);
}
