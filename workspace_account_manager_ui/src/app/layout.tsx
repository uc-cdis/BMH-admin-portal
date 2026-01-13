import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


export const metadata = {
  title: 'BMH Admin Portal',
  description: 'Biomedical Research Hub Administration Portal',
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
        <main>{children}</main>
      </body>
    </html>
  );
}
