# Deploy Odyssey on Vercel

Odyssey's web app uses the same Supabase project as the mobile app. Its production address is `https://odyssey.hxndev.com`.

## GitHub and Vercel

1. Push the branch containing the web changes. For a web-only deployment, deploy your web branch directly. Odyssey's existing GitHub workflow publishes a mobile OTA when `main` receives a push.
2. In Vercel, select **Add New → Project** and import `HxnDev/Odyssey`. Use the repository root, the **Other** framework preset, and Node.js **22.x**. The repository's `vercel.json` sets the build command and output directory and handles direct visits to routes such as `/trip/<id>`.
3. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` under **Settings → Environment Variables** for Production, and for Preview if you plan to test there. Use the existing Odyssey project URL and its public anon or publishable key. Keep the service role key, Google client secret, and RapidAPI key out of the web project's environment.
4. Under **Settings → Environments → Production → Branch Tracking**, select the branch with the web changes. Start a deployment from that branch if Vercel has only deployed the old default branch. If the variables were added after a deployment was created, redeploy so the build gets them.
5. Under **Settings → Domains**, add `odyssey.hxndev.com`. Copy the CNAME target Vercel displays.

[Expo web publishing](https://docs.expo.dev/guides/publishing-websites/#vercel) · [Vercel branch tracking](https://vercel.com/docs/git#production-branch) · [Vercel custom domains](https://vercel.com/docs/domains/set-up-custom-domain)

## Namecheap

Open **Domain List → hxndev.com → Manage → Advanced DNS → Host Records**. Add a **CNAME Record** with **Host** `odyssey`, **Value** set to the CNAME target from Vercel, and **TTL** set to **Automatic**. Save, then wait for Vercel to show that DNS and HTTPS are ready. The domain currently uses Namecheap nameservers.

[Namecheap CNAME instructions](https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/)

## Supabase Auth

In the existing Odyssey project, open **Authentication → URL Configuration**. Set **Site URL** to `https://odyssey.hxndev.com` and save. Supabase uses this address as its fallback when a requested redirect is missing or falls outside the allowed URLs. Leaving it at `http://localhost:3000` can send users to localhost after Google sign-in.

Add the following **Redirect URLs** alongside the existing mobile entries:

- `https://odyssey.hxndev.com/`
- `https://odyssey.hxndev.com/reset-password`

Add the same two paths on your exact preview or localhost origin if you test sign-up, Google sign-in, or password recovery there. For Google sign-in, the Google Cloud OAuth client's authorized redirect URI remains the Supabase callback URL displayed in the Google provider settings.

[Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) · [Google provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

## Verify the deployment

- Sign in with an existing test account and confirm that its countries, trips, and passport appear.
- Switch between light and dark themes, select countries and cities on the map, and open the app at a mobile browser width.
- Open an existing trip, refresh the page, and verify that the trip still opens. Check the cover photo upload and JSON export.
- Test email confirmation and password recovery with a test account. Test Google sign-in if the provider is enabled.

Browser flight lookups use the keyless route lookup. Scheduled times can be entered manually.
