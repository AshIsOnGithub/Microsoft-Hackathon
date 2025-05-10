'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../lib/ThemeProvider';

export default function ClientThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
} 