import { UserRole } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    id: string;
  }
}


