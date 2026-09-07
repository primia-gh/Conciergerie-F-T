import type { Metadata } from "next";
import { DesignSystemShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design System — Conciergerie Premium",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
