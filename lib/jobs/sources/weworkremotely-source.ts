import { XMLParser } from "fast-xml-parser";
import type { JobSource } from "@prisma/client";
import { BaseJobSource } from "@/lib/jobs/sources/base-source";
import type { RawJobListing } from "@/lib/jobs/types";

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  region?: { "#text"?: string };
  company?: { name?: { "#text"?: string } };
}

export class WeWorkRemotelySource extends BaseJobSource {
  readonly source: JobSource = "WE_WORK_REMOTELY";
  readonly name = "We Work Remotely";

  isEnabled(): boolean {
    return process.env.JOB_SOURCE_WWR_ENABLED !== "false";
  }

  async fetchJobs(): Promise<RawJobListing[]> {
    const xml = await this.fetchText(
      "https://weworkremotely.com/remote-jobs.rss",
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const parsed = parser.parse(xml);
    const items: RssItem[] = parsed?.rss?.channel?.item ?? [];
    const itemList = Array.isArray(items) ? items : [items];

    return itemList
      .filter((item) => item.title && item.link)
      .map((item) => {
        const titleParts = (item.title ?? "").split(": ");
        const companyName =
          item.company?.name?.["#text"] ??
          (titleParts.length > 1 ? titleParts[0] : "Unknown Company");
        const title =
          titleParts.length > 1 ? titleParts.slice(1).join(": ") : item.title!;

        return {
          source: this.source,
          externalId: item.link!,
          sourceUrl: item.link,
          title,
          companyName,
          description: this.stripTags(item.description ?? title),
          applyUrl: item.link!,
          location: item.region?.["#text"] ?? "Remote",
          remotePolicy: "REMOTE" as const,
          postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
          rawPayload: item,
        };
      });
  }
}
