import notificationRoutes from './routes/notification.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// ... other imports and middleware ...

app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes); 