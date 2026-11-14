import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Desmonta lo renderizado en cada prueba para que no se acumule entre una y otra
afterEach(() => {
  cleanup();
});
