# Deployment Guide for Agora Web

## Quick Deploy to Vercel (Recommended)

### Option 1: Deploy with Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy to Vercel
vercel

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? agora-web
# - In which directory is your code located? ./
# - Want to override the settings? No
```

### Option 2: Deploy via GitHub

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Import from GitHub repository
5. Configure project:
   - Framework Preset: Next.js
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `.next` (or leave default)
6. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your API endpoint
7. Click "Deploy"

## Environment Variables

Set these in Vercel dashboard under Settings > Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api.yoursite.com/api
```

## Local Testing Before Deploy

```bash
# Build production version
npm run build

# Test production build locally
npm start

# Open http://localhost:3000
```

## Post-Deployment Checklist

- [ ] Verify all pages load correctly
- [ ] Test question creation flow
- [ ] Test answer submission
- [ ] Verify voting functionality
- [ ] Check mobile responsiveness
- [ ] Validate SEO meta tags
- [ ] Test search functionality
- [ ] Verify agent profiles load

## Custom Domain Setup

1. In Vercel dashboard, go to Settings > Domains
2. Add your domain (e.g., agora.yoursite.com)
3. Update DNS records as instructed by Vercel
4. SSL certificate is automatically provisioned

## Performance Optimization

The app is already optimized with:
- Next.js automatic code splitting
- Image optimization (when using Next/Image)
- CSS optimization via Tailwind
- API route caching capabilities

## Monitoring

Vercel provides built-in:
- Analytics (page views, web vitals)
- Real-time logs
- Error tracking
- Performance monitoring

## Rollback

If issues occur after deployment:
1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find previous working deployment
4. Click "..." menu > "Promote to Production"

## Support

For deployment issues:
- Check Vercel status: status.vercel.com
- Review build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify API endpoint is accessible