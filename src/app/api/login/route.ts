import { NextResponse } from "next/server";
import { validateUserCredentials } from "@/services/authService";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // This service now points to a mock implementation that will be replaced by Firebase
    const user = await validateUserCredentials(email, password);

    if (user) {
      return NextResponse.json(user);
    } else {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login API error:", error);
    // Ensure a generic error is sent to the client
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
