import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { setupTestDatabase, teardownTestDatabase, clearTestDatabase } from '../setup.js';
import { notificationService } from '../../src/services/notification.service.js';

describe('Task 4: Notification Service, Preferences & Real-time Integration Tests', () => {
  const app = createApp();
  let studentToken: string;
  let studentUserId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    // Register a student
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'notify.student@university.edu',
        password: 'ValidPassword123!',
        firstName: 'Notify',
        lastName: 'Student',
        role: 'STUDENT',
      });

    studentToken = res.body.data.token;
    studentUserId = res.body.data.user.id;
  });

  it('should deliver in-app notifications and suppress duplicates via idempotencyKey', async () => {
    const key = `idemp_test_key_12345`;

    // 1. Send first notification
    const notif1 = await notificationService.sendNotification({
      userId: studentUserId,
      type: 'REQUEST_ACCEPTED',
      title: 'Mentorship Confirmed',
      message: 'Your mentor Jane has accepted your outreach.',
      idempotencyKey: key,
    });
    expect(notif1).toBeDefined();

    // 2. Send duplicate notification with same key
    const notif2 = await notificationService.sendNotification({
      userId: studentUserId,
      type: 'REQUEST_ACCEPTED',
      title: 'Mentorship Confirmed Duplicate',
      message: 'Duplicate content',
      idempotencyKey: key,
    });

    expect(notif2?._id.toString()).toBe(notif1?._id.toString());

    // 3. Query via API endpoint
    const apiRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(apiRes.status).toBe(200);
    expect(apiRes.body.success).toBe(true);
    expect(apiRes.body.data.notifications.length).toBe(1);
    expect(apiRes.body.data.unreadCount).toBe(1);
  });

  it('should mark single notification as read and mark all as read', async () => {
    // Dispatch 2 notifications
    const n1 = await notificationService.sendNotification({
      userId: studentUserId,
      type: 'HEALTH_NUDGE',
      title: 'Check In 1',
      message: 'Time for check in',
    });

    await notificationService.sendNotification({
      userId: studentUserId,
      type: 'HEALTH_NUDGE',
      title: 'Check In 2',
      message: 'Time for check in 2',
    });

    // Mark first as read
    const patchRes = await request(app)
      .patch(`/api/v1/notifications/${n1?._id}/read`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(patchRes.status).toBe(200);

    // Verify unread count is now 1
    let listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.body.data.unreadCount).toBe(1);

    // Mark all as read
    const allRes = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(allRes.status).toBe(200);

    listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.body.data.unreadCount).toBe(0);
  });

  it('should manage per-user notification preferences', async () => {
    // 1. Get default preferences
    const getRes = await request(app)
      .get('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.emailNotifications).toBe(true);
    expect(getRes.body.data.sessionReminders).toBe(true);

    // 2. Update preferences
    const putRes = await request(app)
      .put('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        emailNotifications: false,
        healthNudges: false,
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.data.emailNotifications).toBe(false);
    expect(putRes.body.data.healthNudges).toBe(false);
    expect(putRes.body.data.sessionReminders).toBe(true); // unchanged
  });
});
