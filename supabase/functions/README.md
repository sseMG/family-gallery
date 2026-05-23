# Edge Functions

## `delete-cloudinary-asset`

Server-side Cloudinary destroy (keeps `CLOUDINARY_API_SECRET` off the client).

Deploy and set secrets:

```bash
supabase secrets set CLOUDINARY_CLOUD_NAME=your_cloud_name
supabase secrets set CLOUDINARY_API_KEY=your_api_key
supabase secrets set CLOUDINARY_API_SECRET=your_api_secret
supabase functions deploy delete-cloudinary-asset
```

Requires a signed-in user (JWT passed from the app).
