import 'server-only';

export type NotificationType = 'contact_request' | 'system_alert';

export interface Notification {
  type: NotificationType;
  recipientId?: string;
  subject: string;
  body: string;
  metadata?: Record<string, string>;
}

export interface NotificationResult {
  success: boolean;
  providerId?: string;
  error?: {
    category:
      | 'invalid_request'
      | 'unauthorized'
      | 'rate_limited'
      | 'timeout'
      | 'transient_failure'
      | 'permanent_rejection';
    message: string;
  };
}

export interface NotificationProvider {
  send(notification: Notification): Promise<NotificationResult>;
}

export class ConsoleNotificationProvider implements NotificationProvider {
  async send(notification: Notification): Promise<NotificationResult> {
    console.log('[Notification]', JSON.stringify(notification, null, 2));
    return {
      success: true,
      providerId: 'console-provider',
    };
  }
}

export function createNotificationProvider(): NotificationProvider {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configure a real notification provider');
  }
  return new ConsoleNotificationProvider();
}
