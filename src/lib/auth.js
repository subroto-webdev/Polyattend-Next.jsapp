import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import dbConnect from './dbConnect';
import User from './models/User';

export function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
}

/**
 * Authenticates the request using the Bearer token and (optionally) checks role.
 * Returns { user } on success, or { error: NextResponse } on failure.
 * Usage:
 *   const auth = await requireAuth(req);
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 */
export async function requireAuth(request, roles = null) {
  await dbConnect();
  try {
    const authHeader = request.headers.get('authorization') || '';
    let token;
    if (authHeader.startsWith('Bearer')) token = authHeader.split(' ')[1];
    if (!token) {
      return { error: NextResponse.json({ success: false, message: 'Not authorized, no token' }, { status: 401 }) };
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return { error: NextResponse.json({ success: false, message: 'User not found or inactive' }, { status: 401 }) };
    }
    if (roles && !roles.includes(user.role)) {
      return { error: NextResponse.json({ success: false, message: `Role '${user.role}' is not authorized to access this route` }, { status: 403 }) };
    }
    return { user };
  } catch (error) {
    return { error: NextResponse.json({ success: false, message: 'Not authorized, token failed' }, { status: 401 }) };
  }
}

export function errorResponse(error, status = 500) {
  // Server-side এ পুরো error সবসময় log হয় (debugging-এর জন্য), কিন্তু client-কে raw JS
  // internal error (যেমন "Cannot read properties of null...") কখনো পাঠানো হয় না —
  // বদলে একটা বোধগম্য বাংলা বার্তা পাঠানো হয়।
  console.error('[API ERROR]', error);

  const raw = error?.message || '';
  const isRawJsCrash = /Cannot read propert(y|ies) of (null|undefined)/i.test(raw) || error instanceof TypeError;

  const message = isRawJsCrash
    ? 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। আবার চেষ্টা করুন, সমস্যা থাকলে Admin-কে জানান।'
    : (raw || 'Server error');

  return NextResponse.json({
    success: false,
    message,
    // শুধু development-এ raw error দেখাবে (debugging-এর জন্য), production-এ কখনো না।
    debug: process.env.NODE_ENV !== 'production' ? raw : undefined,
  }, { status });
}
