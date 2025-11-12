import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt", // ✅ required so middleware + JWT token works
  },
  pages: {
    signIn: "/signin", // 👈 adjust this to your actual sign-in page
  },

  // 👇 Callbacks let you hook into NextAuth's lifecycle
  callbacks: {
    /**
     * Runs right after a successful sign-in.
     * Here we call your Express backend to create or get the user.
     */
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
          const data = await res.json().catch(() => null);
          const idFromDb =
            data?.user?._id || data?.user?.id || data?._id || data?.id || null;
          if (idFromDb) {
            (user as any).mongoId = idFromDb;
          }
        }
      } catch (_) {
        // do not block sign-in on backend failure; jwt will attempt again
      }
      return true;
    },

    /**
     * Attach user info to JWT
     */
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }

      // If signIn callback provided a mongo id, use it
      if (user && (user as any).mongoId) {
        (token as any).userId = (user as any).mongoId;
      }

      // If we don't yet have a Mongo user id, resolve it from the backend
      if (!(token as any).userId && token.email && token.name) {
        const baseUrl = process.env.BACKEND_URL;
        if (baseUrl) {
          try {
            // Upsert/fetch via auth endpoint
            const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: token.email,
                name: token.name,
              }),
            });
            if (res.ok) {
              const data = await res.json().catch(() => null);
              const idFromDb =
                data?.user?._id || data?.user?.id || data?._id || data?.id || null;
              if (idFromDb) {
                (token as any).userId = idFromDb as any;
              }
            }
          } catch (e) {
            console.error("JWT callback: error contacting backend auth endpoint", e);
          }
        }
      }

      // Fallback: try fetching by email if still missing
      if (!(token as any).userId && token.email) {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "";
        if (baseUrl) {
          try {
            const res = await fetch(
              `${baseUrl.replace(/\/+$/, "")}/users/by-email?email=${encodeURIComponent(
                token.email as string
              )}`
            );
            if (res.ok) {
              const data = await res.json().catch(() => null);
              const idFromDb =
                data?.user?._id || data?.user?.id || data?._id || data?.id || null;
              if (idFromDb) {
                (token as any).userId = idFromDb as any;
              }
            }
          } catch (e) {
            console.error("JWT callback: error fetching user by email", e);
          }
        }
      }

      return token;
    },

    /**
     * Make user info available to the client session
     */
    async session({ session, token }) {
      session.user = {
        id: (token as any).userId,
        email: token.email as string | undefined,
        name: token.name as string | undefined,
      } as any;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
