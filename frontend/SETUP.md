# Frontend Configuration Guide

## Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```env
# Backend API URL (same as Socket.IO server)
VITE_API_URL=http://localhost:5000

# Backend Socket.IO URL  
VITE_SOCKET_URL=http://localhost:5000
```

## Development

```bash
npm run dev      # Start dev server on http://localhost:5173
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Production Build

```bash
npm run build
```

This creates an optimized build in the `dist/` folder ready for deployment.

## Customization

### Change Default Server Port

Edit the URL in `.env`:
```env
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

### Change Default Settings

Edit `frontend/src/App.tsx`:
- Default topic (line 95): `const [topic, setTopic] = useState("General Knowledge");`
- Default difficulty (line 96): `const [difficulty, setDifficulty] = useState("medium");`

### Styling

Main styles are in:
- `App.css` - Game UI components
- `index.css` - Global styles and theme

The app uses a dark theme (slate and indigo colors). Colors can be customized by updating the CSS variables.

## Troubleshooting

**Cannot connect to server**
- Check backend is running on the port specified in `.env`
- Verify VITE_API_URL and VITE_SOCKET_URL point to the same backend

**Socket.IO connection refused**
- Backend CORS settings need to match frontend URL
- Check backend `.env` FRONTEND_URL matches your frontend address

**React errors in console**
- Clear browser cache (Ctrl+Shift+Delete)
- Restart dev server

## Deployment

### Vercel (Recommended for React)
```bash
npm run build
# Connect to Vercel and select the `frontend` folder
```

### Azure Static Web Apps
```bash
npm run build
# Deploy the `dist` folder to Static Web App
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## Performance Tips

1. The dev server includes automatic reloading on file changes
2. Production build minifies and optimizes all assets
3. Socket.IO automatically reconnects on disconnect
4. UI updates are optimized with React hooks
