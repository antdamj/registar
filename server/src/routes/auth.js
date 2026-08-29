const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Google OAuth login - redirect to Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.clientUrl}/login?error=auth_failed`,
  }),
  async (req, res) => {
    try {
      const { email, displayName } = req.user;

      // Check if member exists
      const member = await prisma.member.findUnique({
        where: { associationEmail: email },
      });

      const tokenPayload = {
        email,
        displayName,
      };

      if (member) {
        tokenPayload.memberId = member.id;
        tokenPayload.appRole = member.appRole;
        tokenPayload.isNewUser = false;
      } else {
        tokenPayload.memberId = null;
        tokenPayload.appRole = null;
        tokenPayload.isNewUser = true;
      }

      const token = jwt.sign(tokenPayload, config.jwtSecret, {
        expiresIn: '24h',
      });

      // Redirect to frontend with token
      res.redirect(`${config.clientUrl}/auth/callback?token=${token}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${config.clientUrl}/login?error=server_error`);
    }
  }
);

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { email, memberId, isNewUser } = req.user;

    if (isNewUser || !memberId) {
      // Check if there's a pending application
      const pending = await prisma.pendingMember.findUnique({
        where: { googleEmail: email },
      });

      return res.json({
        email,
        isNewUser: true,
        hasPendingApplication: !!pending,
        member: null,
      });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        homeSection: true,
        sections: { include: { section: true } },
        teams: { include: { team: true } },
        drinks: { include: { drink: true } },
        allergies: { include: { allergy: true } },
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Član nije pronađen.' });
    }

    res.json({
      email,
      isNewUser: false,
      hasPendingApplication: false,
      member,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});

module.exports = router;
