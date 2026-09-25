import type { Metadata } from "next";
import { bodoni } from "@/app/fonts";
import { DesignSystemShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <div className={`${bodoni.variable} theme-premium flex flex-1 flex-col`}>
      <DesignSystemShowcase />
    </div>
  );
}
