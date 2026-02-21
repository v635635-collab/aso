import { apiSuccess } from '@/lib/utils';

export async function POST() {
  const response = apiSuccess({ message: 'Logged out' });

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
