declare module 'jsdom';

declare namespace jest {
  interface Matchers<R> {
    toHaveTextContent(text: string | RegExp): R;
    toHaveAttribute(name: string, value?: string | RegExp): R;
  }
}
