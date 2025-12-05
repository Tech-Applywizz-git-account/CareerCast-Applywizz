# Deploying the Admin Update Password Function

This function allows admins to update influencer passwords directly without sending emails.

## Prerequisites

1.  Supabase CLI installed.
2.  Logged in to Supabase (`supabase login`).

## Deployment

Run the following command in your terminal from the project root:

```bash
supabase functions deploy admin-update-password
```

## Environment Variables

Ensure your Supabase project has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available. These are usually available by default in Edge Functions.

## Usage

The Admin Dashboard is already configured to call this function when you reset a password.
