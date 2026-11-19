// Modified for the Yinghuo Career web edition.
import type { Metadata } from "next";
import { CareerLanding } from "./career-landing";

export const metadata: Metadata = {
  title: "萤火职航｜去想去的城市，做想做的事",
  description: "逛八座城市，找实习和校招岗位。用同一个工作台改简历、准备面试、跟进投递。",
};

export default function Home() {
  return <CareerLanding />;
}
