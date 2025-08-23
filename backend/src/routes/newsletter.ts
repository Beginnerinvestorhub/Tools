import express from 'express';

const router = express.Router();

// POST /api/newsletter
router.post('/', async (req, res) => {
  const { email } = req.body;
  // This is safer and less prone to ReDoS (still not RFC compliant)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // TODO: Integrate with real newsletter provider (Mailchimp, ConvertKit, etc.)
  // For now, just log and simulate success
  const sanitizedEmail = email.replace(/[\n\r]/g, '');
  console.log('Newsletter signup:', sanitizedEmail);
  return res.json({ success: true });
});

export default router;
