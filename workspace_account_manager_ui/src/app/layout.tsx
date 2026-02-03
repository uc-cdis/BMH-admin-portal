import { Geist } from "next/font/google";
import "./globals.css";
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Navbar } from '@/components/navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata = {
  title: 'Workspace Account Manager',
  description: 'Workspace Account Management Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>
        <Navbar />
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
