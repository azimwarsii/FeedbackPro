import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    mongoId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const res = await fetch(`${process.env.BACKEND_URL}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
          }),
        });
        if (res.ok) {
          const data = (await res.json().catch(() => null)) as {
            user?: { _id?: string; id?: string };
            _id?: string;
            id?: string;
          } | null;
          const idFromDb = data?.user?._id || data?.user?.id || data?._id || data?.id || null;
          if (idFromDb) {
            user.mongoId = idFromDb;
          }
        }
      } catch {
        // ignore
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }

      if (user && user.mongoId) {
        token.userId = user.mongoId;
      }

      if (!token.userId && token.email && token.name) {
        const baseUrl = process.env.BACKEND_URL;
        if (baseUrl) {
          try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: token.email,
                name: token.name,
              }),
            });
            if (res.ok) {
              const data = (await res.json().catch(() => null)) as {
                user?: { _id?: string; id?: string };
                _id?: string;
                id?: string;
              } | null;
              const idFromDb = data?.user?._id || data?.user?.id || data?._id || data?.id || null;
              if (idFromDb) {
                token.userId = idFromDb;
              }
            }
          } catch (e) {
            console.error("JWT callback: error contacting backend auth endpoint", e);
          }
        }
      }

      if (!token.userId && token.email) {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "";
        if (baseUrl) {
          try {
            const res = await fetch(
              `${baseUrl.replace(/\/+$/, "")}/users/by-email?email=${encodeURIComponent(
                token.email as string
              )}`
            );
            if (res.ok) {
              const data = (await res.json().catch(() => null)) as {
                user?: { _id?: string; id?: string };
                _id?: string;
                id?: string;
              } | null;
              const idFromDb = data?.user?._id || data?.user?.id || data?._id || data?.id || null;
              if (idFromDb) {
                token.userId = idFromDb;
              }
            }
          } catch (e) {
            console.error("JWT callback: error fetching user by email", e);
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.userId || "",
        email: token.email as string | undefined,
        name: token.name as string | undefined,
      };
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

