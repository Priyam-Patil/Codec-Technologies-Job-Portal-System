import { Webhook } from 'svix';
import User from '../models/User.js';

export default async function clerkWebhooks(req, res, next) {
  let event;
  try {
    event = new Webhook(process.env.CLERK_WEBHOOK_SECRET).verify(req.body.toString('utf8'), {
      'svix-id': req.headers['svix-id'], 'svix-timestamp': req.headers['svix-timestamp'], 'svix-signature': req.headers['svix-signature'],
    });
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }
  try {
    const { data, type } = event;
    if (type === 'user.created' || type === 'user.updated') {
      const primary = data.email_addresses?.find(email => email.id === data.primary_email_address_id) || data.email_addresses?.[0];
      if (!data.id || !primary?.email_address) return res.status(400).json({ success: false, message: 'Incomplete identity event' });
      const identity = { email: primary.email_address, name: [data.first_name, data.last_name].filter(Boolean).join(' ') || primary.email_address, image: data.image_url || '' };
      await User.updateOne({ _id: data.id }, { $set: identity, $setOnInsert: { resume: '' } }, { upsert: true, runValidators: true });
    } else if (type === 'user.deleted') {
      await User.findByIdAndDelete(data.id);
    }
    res.json({ success: true, message: 'Webhook received' });
  } catch (error) { next(error); }
}
