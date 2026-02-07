import jwt from 'jsonwebtoken';

export const optionalAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // guest
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    req.user = { id: (decoded as any).id }; // ✅ FIX
    // console.log('optionalAuth user:', req.user);

    next();
  } catch {
    next(); // invalid token → treat as guest
  }
};
