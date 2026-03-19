/// <reference types="vite/client" />

declare module "reading-time/lib/reading-time" {
  type ReadTimeResults = {
    text: string;
    time: number;
    words: number;
    minutes: number;
  };

  export default function readingTime(text: string): ReadTimeResults;
}
