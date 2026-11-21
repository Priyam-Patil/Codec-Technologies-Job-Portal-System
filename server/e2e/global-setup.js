import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { clerkSetup } from '@clerk/testing/playwright';

export default async function setup() {
  const server = dotenv.parse(await fs.readFile(new URL('../.env', import.meta.url)));
  const client = dotenv.parse(await fs.readFile(new URL('../../client/.env.local', import.meta.url)));
  if (!server.CLERK_SECRET_KEY?.startsWith('sk_test_') || !client.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) throw new Error('Browser tests require a Clerk development instance');
  // Official helper disables bot challenges only. Tests still type credentials/OTP into Clerk UI.
  const settings = await clerkSetup({ secretKey: server.CLERK_SECRET_KEY, publishableKey: client.VITE_CLERK_PUBLISHABLE_KEY, dotenv: false });
  if (settings) Object.assign(process.env, settings);
}
