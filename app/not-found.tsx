import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Not Found",
  description: "Page not found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4">Page not found</p>
    </div>
  );
}
