import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import webpush from 'web-push';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Generate VAPID keys (in production, store these securely)
const vapidKeys = webpush.generateVAPIDKeys();

webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscriptions in memory (for demo purposes)
let subscriptions: webpush.PushSubscription[] = [];

// API Routes
app.get('/api/vapid-public-key', (req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/subscribe', (req: Request, res: Response) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({});
});

app.post('/api/notify', (req: Request, res: Response) => {
  const { title, body } = req.body;
  const notificationPayload = JSON.stringify({ title, body });

  const promises = subscriptions.map(sub => 
    webpush.sendNotification(sub, notificationPayload)
      .catch((err: any) => {
        console.error("Error sending notification, removing subscription", err);
        // Remove invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
             subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
        }
      })
  );

  Promise.all(promises)
    .then(() => res.json({ success: true }))
    .catch((err: any) => {
      console.error("Error sending notifications", err);
      res.sendStatus(500);
    });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if built)
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`VAPID Public Key: ${vapidKeys.publicKey}`);
  });
}

startServer();
