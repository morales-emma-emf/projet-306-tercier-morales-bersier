"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const goToAuth = () => {
    router.push("/login");
  };

  return (
    goToAuth()
  );
}