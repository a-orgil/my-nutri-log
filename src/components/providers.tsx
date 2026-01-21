"use client";

import { SessionProvider } from "next-auth/react";
import type { JSX, ReactNode } from "react";

// NextAuth v5 betaとReact 19の型互換性のためのキャスト
const Provider = SessionProvider as unknown as (props: {
  children: ReactNode;
}) => JSX.Element;

export function Providers({ children }: { children: ReactNode }): ReactNode {
  return <Provider>{children}</Provider>;
}
