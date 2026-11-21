import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

// Identity comes only from Clerk after protectUser has verified the request.
// Webhooks remain authoritative for later identity updates; local sign-in need not wait for delivery.
export async function ensureCandidateProfile(userId, readIdentity = id => clerkClient.users.getUser(id)) {
  const existing = await User.findById(userId);
  if (existing) return existing;
  let identity;
  try { identity = await readIdentity(userId); }
  catch { throw Object.assign(new Error('Unable to load your verified account. Please retry.'), { status: 503 }); }
  const primary = identity.emailAddresses?.find(email => email.id === identity.primaryEmailAddressId) || identity.emailAddresses?.[0];
  if (identity.id !== userId || !primary?.emailAddress) throw Object.assign(new Error('Your verified account needs an email address.'), { status: 422 });
  const values = { name: [identity.firstName, identity.lastName].filter(Boolean).join(' ') || primary.emailAddress,
    email: primary.emailAddress, image: identity.imageUrl || 'https://www.gravatar.com/avatar/?d=mp', resume: '' };
  try {
    return await User.findOneAndUpdate({ _id: userId }, { $setOnInsert: values }, { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true });
  } catch (error) {
    if (error.code === 11000) {
      const winner = await User.findById(userId);
      if (winner) return winner;
      throw Object.assign(new Error('Account profile conflict. Please contact support.'), { status: 409 });
    }
    throw error;
  }
}
