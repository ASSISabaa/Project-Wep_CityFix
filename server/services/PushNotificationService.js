const webpush = require('web-push');

class PushNotificationService {
    constructor() {
        if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            webpush.setVapidDetails(
                'mailto:cityfix.contact@gmail.com',
                process.env.VAPID_PUBLIC_KEY,
                process.env.VAPID_PRIVATE_KEY
            );
        }
    }

    async sendNotification(subscription, payload) {
        try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            return { success: true };
        } catch (error) {
            console.error('Push notification failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendToMultiple(subscriptions, payload) {
        const promises = subscriptions.map(sub => 
            this.sendNotification(sub, payload)
        );
        
        const results = await Promise.allSettled(promises);
        
        return {
            sent: results.filter(r => r.status === 'fulfilled').length,
            failed: results.filter(r => r.status === 'rejected').length
        };
    }

    createPayload(title, body, data = {}) {
        return {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1,
                ...data
            },
            actions: [
                {
                    action: 'view',
                    title: 'View'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ]
        };
    }
}

module.exports = new PushNotificationService();