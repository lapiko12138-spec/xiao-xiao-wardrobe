import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小小衣橱",
  description: "奶油白与浅绿色风格的三栏移动端 UI 还原"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
