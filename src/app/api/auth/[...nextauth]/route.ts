import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

let handler: any;

try {
  handler = NextAuth(authOptions);
} catch (error) {
  console.error('NextAuth initialization error:', error);
  // Fallback handler that returns error
  handler = async (req: any, res: any) => {
    return res.status(500).json({ error: 'Authentication not available' });
  };
}

export { handler as GET, handler as POST };

