self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Lava Jato Pro';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: '/icon-192x192.png', // Ensure this icon exists or use a default one
    badge: '/badge-72x72.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
