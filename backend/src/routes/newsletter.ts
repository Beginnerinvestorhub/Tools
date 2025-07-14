import express from 'express';

const router = express.Router();

// POST /api/newsletter
router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // TODO: Integrate with real newsletter provider (Mailchimp, ConvertKit, etc.)
  // For now, just log and simulate success
  console.log('Newsletter signup:', email);
  return res.json({ success: true });
});

export default router;
