import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import axios from 'axios';

export const authRouter = Router();

// WHOP OAuth callback
authRouter.get('/whop/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code missing' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.whop.com/oauth/token', {
      client_id: process.env.WHOP_CLIENT_ID,
      client_secret: process.env.WHOP_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.WHOP_REDIRECT_URI,
    });

    const { access_token } = tokenResponse.data;

    // Get user info from WHOP
    const userResponse = await axios.get('https://api.whop.com/api/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const whopUser = userResponse.data;

    // Check if user has active membership
    // WHOP API: Get user's memberships
    let membershipActive = false;
    try {
      const membershipsResponse = await axios.get(
        `https://api.whop.com/api/v2/memberships?user_id=${whopUser.id}`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      // Check if user has any active membership
      const memberships = membershipsResponse.data?.data || [];
      membershipActive = memberships.some((membership: any) => membership.status === 'active');
    } catch (membershipError: any) {
      console.error('Error checking membership:', membershipError.message);
      // Try alternative endpoint
      try {
        const membershipResponse = await axios.get(
          `https://api.whop.com/api/v2/memberships/${whopUser.id}`,
          {
            headers: { Authorization: `Bearer ${access_token}` },
          }
        );
        membershipActive = membershipResponse.data?.status === 'active';
      } catch (altError) {
        console.error('Alternative membership check failed:', altError);
        // Default to false if we can't verify
        membershipActive = false;
      }
    }

    // Save/update user in database
    await User.findOneAndUpdate(
      { whop_user_id: whopUser.id },
      {
        whop_user_id: whopUser.id,
        email: whopUser.email,
        membership_active: membershipActive,
        last_checked_at: new Date(),
        updated_at: new Date(),
      },
      { upsert: true, new: true }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${access_token}`);
  } catch (error: any) {
    console.error('WHOP auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Verify WHOP membership
authRouter.post('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    const { whop_user_id } = req.body;

    if (!token && !whop_user_id) {
      return res.status(400).json({ error: 'Token or User ID required' });
    }

    let userId = whop_user_id;

    // If token provided, get user ID from WHOP
    if (token && !userId) {
      try {
        const userResponse = await axios.get('https://api.whop.com/api/v2/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        userId = userResponse.data.id;
      } catch (error: any) {
        return res.status(401).json({ error: 'Invalid token', active: false });
      }
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID required', active: false });
    }

    // Check in database
    const user = await User.findOne({ whop_user_id: userId });

    const lastChecked = user?.last_checked_at
      ? new Date(user.last_checked_at).getTime()
      : 0;
    const now = Date.now();
    const hoursSinceCheck = (now - lastChecked) / (1000 * 60 * 60);

    // Re-check membership if last check was more than 1 hour ago or user not found
    if (!user || hoursSinceCheck > 1) {
      if (token) {
        try {
          // Call WHOP API to verify current membership status
          const membershipsResponse = await axios.get(
            `https://api.whop.com/api/v2/memberships?user_id=${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const memberships = membershipsResponse.data?.data || [];
          const membershipActive = memberships.some((m: any) => m.status === 'active');

          // Update database with latest status
          await User.findOneAndUpdate(
            { whop_user_id: userId },
            {
              whop_user_id: userId,
              membership_active: membershipActive,
              last_checked_at: new Date(),
              updated_at: new Date(),
            },
            { upsert: true, new: true }
          );

          return res.json({ active: membershipActive });
        } catch (error: any) {
          console.error('WHOP API verification error:', error.message);
          // If WHOP API fails and user exists, return cached status
          if (user) {
            return res.json({ active: user.membership_active });
          }
          return res.status(500).json({ error: 'Verification failed', active: false });
        }
      } else {
        // No token provided, return cached status if available
        if (user) {
          return res.json({ active: user.membership_active });
        }
        return res.json({ active: false, message: 'User not found and no token provided' });
      }
    }

    // Return cached status if recent
    res.json({ active: user.membership_active });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});
