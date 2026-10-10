import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail, upsertOAuthUser } from "@/lib/services/store";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    CredentialsProvider({
      name: "メールアドレス・パスワード",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await findUserByEmail(credentials.email);
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await upsertOAuthUser({
          email: user.email,
          name: user.name,
          image: user.image,
        });
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // ログインしたとき・名前を決めたあと（update）に、データベースの内容で名前を入れ直す
      // 名前の仕組みより前にログインした人（token に usernameSet がない）も、一度だけ読み直す
      const refresh = account?.provider === "google" || trigger === "update" || token.usernameSet === undefined;
      const email = user?.email ?? (refresh ? (token.email as string | undefined) : undefined);
      if (email) {
        // データベースが一時的に読めなくても、ログインそのものは崩さない（今のトークンのまま続ける）。
        // ここで失敗してログインが外れると、アプリの保存データを読めず、空の状態で上書きされる事故につながるため
        try {
          const dbUser = await findUserByEmail(email);
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            // 本人がジサップ用の名前を決めるまでは、名前を出さない（Google の名前＝本名を表に出さないため）
            token.name = dbUser.usernameSet ? dbUser.name : null;
            token.usernameSet = dbUser.usernameSet;
          }
        } catch (e) {
          console.error("[auth] jwt refresh", e instanceof Error ? e.message : e);
          if (user) throw e; // ログインした瞬間（id がまだない）だけは、失敗として扱う
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.name = token.name;
        // 分からないとき（古いトークン）は「決めた」扱いにして、画面をふさがない。決めていない人は次の読み直しで false になる
        (session.user as { usernameSet?: boolean }).usernameSet = token.usernameSet !== false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // ログイン状態をできるだけ長く維持（ブラウザ Cookie の実用上限 ≒ 400 日）
  session: {
    strategy: "jwt",
    maxAge: 400 * 24 * 60 * 60, // 400日
    updateAge: 24 * 60 * 60, // 24時間ごとに期限を延長（アクセスがあれば実質ログイン継続）
  },

  jwt: {
    maxAge: 400 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
