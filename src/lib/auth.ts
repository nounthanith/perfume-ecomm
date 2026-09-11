import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        }).lean();

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        if (user.emailVerified !== true) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();

        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          const newUser = await User.create({
            name: user.name ?? "",
            email: user.email ?? "",
            avatar: user.image ?? "",
            googleId: account.providerAccountId,
            provider: "google",
            role: "user",
            emailVerified: true,
          });
          user.id = newUser._id.toString();
        } else {
          existingUser.googleId = account.providerAccountId;
          existingUser.provider = "google";
          existingUser.emailVerified = true;
          if (!existingUser.avatar && user.image) {
            existingUser.avatar = user.image;
          }
          await existingUser.save();
          user.id = existingUser._id.toString();
        }
      }

      if (account?.provider === "credentials") {
        await connectDB();
        const dbUser = await User.findOne({
          email: user.email,
        })
          .select("_id")
          .lean();
        if (dbUser) {
          user.id = dbUser._id.toString();
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      if (trigger === "update" && session) {
        if (typeof session.name === "string") {
          token.name = session.name;
        }
        if (typeof session.image === "string") {
          token.picture = session.image;
        }
        if (typeof session.id === "string") {
          token.id = session.id;
        }
        if (typeof session.role === "string") {
          token.role = session.role;
        }
      }

      if (token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email })
          .select("role")
          .lean();
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
