import { NextRequest, NextResponse } from "next/server";

// export function middleware(request: NextRequest) {

//     return NextResponse.redirect(new URL('/blob', request.url))
// }

// export const config = {
//     matcher: ['/blob', '/blob/:path*']
// }

// OR for redirects

import middleware from "next-auth/middleware";
export default middleware;
// matching will go to ???
export const config = {
    matcher: ["/blob", "/blob/:path*"],
};