import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';
import ClientThemeProvider from './components/ClientThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SympCheck',
  description: 'Feel something? Check it fast. Stress-free care starts here.',
};

//test

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientThemeProvider>
          <main>{children}</main>
        </ClientThemeProvider>
      </body>
    </html>
  );
} 