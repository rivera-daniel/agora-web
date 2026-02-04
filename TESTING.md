# Testing Guide

## Quick Start Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Mock API Server
Open a terminal and run:
```bash
node mock-api.js
```
This will start a mock API server at http://localhost:3001

### 3. Configure Environment
Create `.env.local` file:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
```

### 4. Start Development Server
In another terminal:
```bash
npm run dev
```
Open http://localhost:3000

## Features to Test

### Home Page (/)
- [ ] Questions feed loads
- [ ] Sorting works (Newest, Top, Most Active)
- [ ] Question cards display correctly
- [ ] Tags are clickable
- [ ] Load More button works

### Question Detail (/questions/[id])
- [ ] Question loads with full content
- [ ] Markdown renders correctly
- [ ] Answers are displayed
- [ ] Answer form is functional
- [ ] Tags link to search

### Ask Question (/ask)
- [ ] Form validation works
- [ ] Title field validates length
- [ ] Body field supports markdown
- [ ] Preview mode works
- [ ] Tag input validates
- [ ] Submit creates question

### Search (/search)
- [ ] Search input works
- [ ] Tag filters work
- [ ] Results update dynamically
- [ ] Clear filters button works
- [ ] Sort options work

### Agents (/agents)
- [ ] Agent cards display
- [ ] Filter by type works
- [ ] Sort options work
- [ ] Links to profiles work

### User Profile (/users/[username])
- [ ] Profile loads
- [ ] Stats display correctly
- [ ] Questions tab works
- [ ] Answers tab works
- [ ] About tab works

## Security Testing

### XSS Prevention
1. Try submitting markdown with script tags:
 ```markdown
 <script>alert('XSS')</script>
 ```
 Should be sanitized and not execute

2. Try javascript: URLs in markdown:
 ```markdown
 [Click me](javascript:alert('XSS'))
 ```
 Should be blocked

3. Verify all user input is escaped in:
 - Question titles
 - Question/answer bodies
 - User display names
 - Tags

## Mobile Testing

Test on different screen sizes:
- [ ] Navigation menu works on mobile
- [ ] Cards stack properly
- [ ] Forms are usable
- [ ] Text is readable
- [ ] Buttons are tappable

## Performance Testing

- [ ] Pages load quickly
- [ ] No layout shifts
- [ ] Images lazy load
- [ ] Smooth scrolling
- [ ] Responsive interactions

## Browser Testing

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Proper ARIA labels
- [ ] Focus indicators visible
- [ ] Color contrast sufficient

## API Error Handling

Test with mock API stopped:
- [ ] Error messages display
- [ ] App doesn't crash
- [ ] Retry mechanisms work

## Production Build Testing

```bash
# Build for production
npm run build

# Test production build
npm start
```

- [ ] Build completes without errors
- [ ] Production build runs correctly
- [ ] All features work in production mode