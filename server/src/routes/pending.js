const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pending = await prisma.pendingMember.findUnique({
      where: { googleEmail: req.user.email },
      include: { homeSection: true },
    });

    if (!pending) {
      return res.status(404).json({ error: 'Nema pending prijave.' });
    }

    res.json(pending);
  } catch (err) {
    console.error('Get pending me error:', err);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email } = req.user;

    // Check if already a member
    const existingMember = await prisma.member.findUnique({
      where: { associationEmail: email },
    });
    if (existingMember) {
      return res.status(400).json({ error: 'Već ste registrirani kao član.' });
    }

    const existingPending = await prisma.pendingMember.findUnique({
      where: { googleEmail: email },
    });
    if (existingPending) {
      return res.status(400).json({ error: 'Već imate prijavu na čekanju.' });
    }

    const {
      firstName,
      lastName,
      oib,
      dateOfBirth,
      address,
      gender,
      faculty,
      phone,
      privateEmail,
      associationEmail,
      memberSince,
      cardNumber,
      membershipLevel,
      fullMemberSince,
      homeSectionId,
      sectionIds,
      teamIds,
      drinkIds,
      allergyIds,
      dietType,
      shirtSize,
      acceptedDocuments,
    } = req.body;

    const errors = [];

    if (!firstName || !firstName.trim()) errors.push('Ime je obavezno.');
    if (!lastName || !lastName.trim()) errors.push('Prezime je obavezno.');
    if (!oib || !/^\d{11}$/.test(oib)) errors.push('OIB mora imati 11 znamenaka.');
    if (!dateOfBirth) errors.push('Datum rođenja je obavezan.');
    if (!address || !address.trim()) errors.push('Adresa je obavezna.');
    if (!gender || !['M', 'Z'].includes(gender)) errors.push('Spol je obavezan (M ili Ž).');
    if (!faculty || !faculty.trim()) errors.push('Fakultet je obavezan.');
    if (!phone || !phone.trim()) errors.push('Broj telefona je obavezan.');
    if (!privateEmail || !privateEmail.trim()) errors.push('Privatni e-mail je obavezan.');
    if (!associationEmail || !associationEmail.trim()) errors.push('E-mail pri udruzi je obavezan.');
    if (!memberSince) errors.push('Datum učlanjenja je obavezan.');
    if (!cardNumber || !cardNumber.trim()) errors.push('Broj iskaznice je obavezan.');
    if (!membershipLevel || !['PRIDRUZENO', 'PUNOPRAVNO', 'POCASNO', 'STARO'].includes(membershipLevel)) {
      errors.push('Razina članstva je obavezna.');
    }
    if (!homeSectionId) errors.push('Matična sekcija je obavezna.');
    if (!dietType || !['MESOJED', 'VEGETARIJANSTVO', 'VEGANSTVO', 'SVEJED'].includes(dietType)) {
      errors.push('Tip prehrane je obavezan.');
    }
    if (!shirtSize || !shirtSize.trim()) errors.push('Veličina majice je obavezna.');
    if (!acceptedDocuments) errors.push('Morate prihvatiti akte i dokumente udruge.');
    if (!drinkIds || !Array.isArray(drinkIds) || drinkIds.length === 0) {
      errors.push('Morate odabrati barem jedno piće.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const fieldData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      oib,
      dateOfBirth,
      address: address.trim(),
      gender,
      faculty: faculty.trim(),
      phone: phone.trim(),
      privateEmail: privateEmail.trim(),
      associationEmail: associationEmail.trim(),
      memberSince,
      cardNumber: cardNumber.trim(),
      membershipLevel,
      fullMemberSince: fullMemberSince || null,
      homeSectionId: parseInt(homeSectionId),
      sectionIds: sectionIds || [],
      teamIds: teamIds || [],
      drinkIds,
      allergyIds: allergyIds || [],
      dietType,
      shirtSize: shirtSize.trim(),
      acceptedDocuments,
    };

    const fieldStatus = {};
    for (const key of Object.keys(fieldData)) {
      fieldStatus[key] = 'PENDING';
    }

    const pending = await prisma.pendingMember.create({
      data: {
        googleEmail: email,
        fieldData,
        fieldStatus,
        homeSectionId: parseInt(homeSectionId),
        status: 'PENDING',
      },
      include: { homeSection: true },
    });

    res.status(201).json(pending);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Duplikat — prijava već postoji.' });
    }
    console.error('Create pending error:', err);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});

module.exports = router;