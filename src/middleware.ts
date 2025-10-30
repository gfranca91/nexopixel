import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = await createClient(request);

    await supabase.auth.getSession();

    return response;
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
