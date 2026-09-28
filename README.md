# BPGC / food

Campus food menus for BITS Goa: weekly mess menu, outlets, night canteens, and a campus map. Prices and timings may change at the counter. The cart estimates a bill; it does not place an order.

## Run locally

`npm install` then `npm run dev`. Build with `npm run build`.

## Data and deployment

The public menu is bundled with the app. Student hearts use anonymous Supabase sessions and row-level security; the public project URL and publishable key are in `hearts.ts`. Never put a service-role key in client code. The campus map imagery is embedded as data modules because the browser uploader renamed the binary files.

The Vercel Hobby deployment is at https://bpgc-food.vercel.app/. It was deployed with Vercel CLI. GitHub is not connected to the Vercel project yet, so pushing to this repo does not automatically deploy. The admin panel is a local preview, not a secured multi-user admin system.
