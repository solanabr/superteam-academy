# Deployment Guide

This guide will help you deploy the Superteam Academy platform to production.

## Quick Deploy to Vercel

### Option 1: Deploy from v0 UI

1. Click the **"Publish"** button in the top right of the v0 interface
2. Vercel will automatically:
   - Create a new Vercel project
   - Connect to your GitHub repository
   - Deploy your application
   - Set up environment variables from integrations

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration
5. Click "Deploy"

### Option 3: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

## Environment Variables

The following environment variables are required in production:

### Supabase (Auto-configured if using integration)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Sanity CMS (Optional for MVP)
```
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token
```

### Solana
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Post-Deployment Configuration

### 1. Update Supabase Authentication URLs

After deployment, you need to update Supabase with your production URL:

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication > URL Configuration**
4. Update the following:
   - **Site URL**: `https://your-domain.vercel.app`
   - **Redirect URLs**: Add `https://your-domain.vercel.app/auth/**`

### 2. Test Authentication Flow

1. Visit your deployed site
2. Click "Sign Up" and create a test account
3. Check your email for the confirmation link
4. Verify the redirect works correctly
5. Test login/logout functionality

### 3. Verify Database Connection

1. Navigate to `/dashboard` (after logging in)
2. Verify user profile loads correctly
3. Check that XP and progress tracking works

### 4. Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Settings" > "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Update Supabase URLs to use custom domain

## Sanity CMS Setup (Optional)

If you're using Sanity for content management:

### 1. Create Sanity Project

```bash
npm create sanity@latest
```

Follow the prompts to create a new project.

### 2. Deploy Sanity Studio

```bash
cd studio
npm run deploy
```

### 3. Add Environment Variables

Add your Sanity credentials to Vercel:
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_TOKEN`

### 4. Import Content Schema

Your Sanity schemas are already defined in `/sanity/schemas/`. Deploy them:

```bash
sanity deploy
```

## Monitoring and Maintenance

### 1. Enable Vercel Analytics

1. Go to your project in Vercel Dashboard
2. Click "Analytics" tab
3. Enable Web Analytics
4. Monitor page views and performance

### 2. Set up Error Tracking (Optional)

Consider integrating Sentry or similar:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 3. Monitor Database Performance

1. In Supabase Dashboard, check "Database > Logs"
2. Monitor slow queries
3. Add indexes as needed for performance

### 4. Backup Strategy

- Supabase automatically backs up your database
- Export important data regularly
- Keep your Sanity content versioned

## Scaling Considerations

### Database Optimization

1. **Add Indexes**: Monitor slow queries and add indexes
2. **Enable Connection Pooling**: Configure Supabase pooling for high traffic
3. **Implement Caching**: Use Vercel's Edge caching for static content

### CDN and Performance

1. **Image Optimization**: Use Next.js Image component (already implemented)
2. **Static Generation**: Course catalog can be statically generated
3. **Edge Functions**: Move compute closer to users

### Rate Limiting

Consider implementing rate limiting for:
- Authentication endpoints
- API routes
- Community posting features

Example with Upstash Redis:
```bash
npm install @upstash/ratelimit @upstash/redis
```

## Troubleshooting

### Build Failures

**Issue**: TypeScript errors during build
- **Solution**: Run `npm run build` locally first to catch errors

**Issue**: Missing environment variables
- **Solution**: Verify all required env vars are set in Vercel

### Authentication Issues

**Issue**: Users not receiving confirmation emails
- **Solution**: Check Supabase email settings and SMTP configuration

**Issue**: Redirect loops after login
- **Solution**: Verify redirect URLs in Supabase match your domain

### Database Connection Errors

**Issue**: Connection pooling errors
- **Solution**: Use Supabase connection pooler URL for serverless functions

**Issue**: RLS policy blocking operations
- **Solution**: Check RLS policies in Supabase Dashboard

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] Supabase RLS policies are enabled on all tables
- [ ] Service role key is kept secure (never exposed to client)
- [ ] Authentication redirects are properly configured
- [ ] API routes validate user permissions
- [ ] Input validation is implemented
- [ ] CORS is properly configured
- [ ] Rate limiting is in place for sensitive endpoints

## Performance Checklist

- [ ] Images are optimized and use Next.js Image component
- [ ] Static pages are pre-rendered where possible
- [ ] Database queries use proper indexes
- [ ] API responses are cached where appropriate
- [ ] Bundle size is optimized
- [ ] Lighthouse score > 90

## Production URL

After deployment, your application will be available at:
- Vercel: `https://your-project.vercel.app`
- Custom domain: `https://your-domain.com` (if configured)

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- GitHub Issues: Create an issue in your repository

---

**Next Steps**: After successful deployment, seed initial content in Sanity and create your first course!
