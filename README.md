# Playground

This project is a lightweight static homepage deployed on Vercel.

## Supabase scaffold

Supabase client setup is scaffolded for browser use without adding a framework yet.

Files:

- `app.js`: initializes the Supabase client when config is present
- `config.example.js`: template for your Supabase project values
- `config.js`: runtime config file used by the deployed site

## Add your Supabase project values

1. Open `config.example.js`
2. Copy the values into `config.js`
3. Set:
   - `url` to your Supabase project URL
   - `anonKey` to your Supabase publishable key

Important:

- Use the publishable/anon key in the browser
- Never put the Supabase `service_role` key in this project

## Vercel note

Because this project is currently a plain static site with no build step, browser config is loaded from `config.js` and deployed as part of the repo.

If you want to manage values through Vercel environment variables later, the next step is to add a small build step or framework so those variables can be injected safely at build time.
