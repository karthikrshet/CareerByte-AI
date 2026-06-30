import { RemoteOkSource } from "@/lib/jobs/sources/remoteok-source";
import { GreenhouseSource } from "@/lib/jobs/sources/greenhouse-source";
import { LeverSource } from "@/lib/jobs/sources/lever-source";
import { AshbySource } from "@/lib/jobs/sources/ashby-source";
import { WeWorkRemotelySource } from "@/lib/jobs/sources/weworkremotely-source";
import { HimalayasSource } from "@/lib/jobs/sources/himalayas-source";
import { JobicySource } from "@/lib/jobs/sources/jobicy-source";
import type { JobSourceAdapter } from "@/lib/jobs/types";
import type { JobSource } from "@prisma/client";

const ALL_SOURCES: JobSourceAdapter[] = [
  new RemoteOkSource(),
  new GreenhouseSource(),
  new LeverSource(),
  new AshbySource(),
  new WeWorkRemotelySource(),
  new HimalayasSource(),
  new JobicySource(),
];

export function getJobSources(): JobSourceAdapter[] {
  return ALL_SOURCES;
}

export function getEnabledJobSources(): JobSourceAdapter[] {
  return ALL_SOURCES.filter((source) => source.isEnabled());
}

export function getJobSourceByType(
  source: JobSource,
): JobSourceAdapter | undefined {
  return ALL_SOURCES.find((s) => s.source === source);
}
