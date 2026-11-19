import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { findTeamActor, teamSessionCookie, teamSessionSeconds } from "@/lib/team";

export async function teamActor() {
  return findTeamActor((await cookies()).get(teamSessionCookie)?.value);
}

export async function requireTeamActor() {
  const actor = await teamActor();
  if (!actor) redirect("/team");
  return actor;
}

export async function updateTeamCookie(value: string) {
  (await cookies()).set(teamSessionCookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/team",
    maxAge: value ? teamSessionSeconds : 0,
  });
}
