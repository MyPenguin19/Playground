# Playground

This project is a lightweight static homepage deployed on Vercel.

## Supabase features

This site now includes:

- Supabase email magic-link auth
- A sample data feed from `sample_messages`
- A contact form that inserts into `contact_messages`

Files:

- `app.js`: initializes the Supabase client and handles auth, reads, and form inserts
- `config.example.js`: template for your Supabase project values
- `config.js`: runtime config file used by the deployed site
- `supabase/setup.sql`: table creation, policies, and seed data

## Add your Supabase project values

1. Open `config.example.js`
2. Copy the values into `config.js`
3. Set:
   - `url` to your Supabase project URL
   - `anonKey` to your Supabase publishable key

Important:

- Use the publishable/anon key in the browser
- Never put the Supabase `service_role` key in this project

## Supabase dashboard setup

1. Create a Supabase project
2. In Supabase, open SQL Editor
3. Run the SQL in `supabase/setup.sql`
4. In Authentication -> URL Configuration:
   - Set Site URL to your production site URL
   - Add `https://playground-neon-two.vercel.app` as a redirect URL
5. Put your project URL and publishable key into `config.js`
6. Push the updated `config.js` to GitHub so Vercel redeploys the site

After that:

- Magic-link sign-in will work from the homepage
- Sample messages will load from Supabase
- The contact form will save rows to `contact_messages`

## Vercel note

Because this project is currently a plain static site with no build step, browser config is loaded from `config.js` and deployed as part of the repo.

If you want to manage values through Vercel environment variables later, the next step is to add a small build step or framework so those variables can be injected safely at build time.
