import { auth } from '../firebase';

// Firestore and Storage rules require an authenticated admin for writes.
// If the session is missing or its token can no longer be refreshed, fail
// with a clear message instead of a raw permission error.
export class SessionExpiredError extends Error {
  constructor() {
    super('Сесијата истече. Одјавете се и најавете се повторно.');
    this.name = 'SessionExpiredError';
  }
}

export const assertValidSession = async (): Promise<void> => {
  const user = auth?.currentUser;
  if (!user) {
    throw new SessionExpiredError();
  }
  try {
    await user.getIdToken(true);
  } catch (error) {
    console.error('Auth token refresh failed:', error);
    throw new SessionExpiredError();
  }
};
