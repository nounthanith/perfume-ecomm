import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { generateOtp, sendVerificationEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    await connectDB();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).select("+otp +otpExpires");

    // Resend flow: account exists but email not verified yet
    if (existingUser && !existingUser.emailVerified) {
      const otp = generateOtp();
      const otpExpires = new Date(
        Date.now() + (Number(process.env.EMAIL_OTP_EXPIRES_MINUTES) || 10) * 60 * 1000
      );

      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();

      await sendVerificationEmail(normalizedEmail, existingUser.name, otp);

      return NextResponse.json(
        {
          message: "Verification code sent. Please check your email.",
          email: normalizedEmail,
        },
        { status: 200 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpExpires = new Date(
      Date.now() + (Number(process.env.EMAIL_OTP_EXPIRES_MINUTES) || 10) * 60 * 1000
    );

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      provider: "credentials",
      role: "user",
      emailVerified: false,
      otp,
      otpExpires,
    });

    await sendVerificationEmail(normalizedEmail, newUser.name, otp);

    return NextResponse.json(
      {
        message: "Account created. Check your email for the verification code.",
        email: normalizedEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}