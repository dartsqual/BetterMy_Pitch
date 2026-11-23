"use client";

import { datadogRum } from "@datadog/browser-rum";
import { useEffect } from "react";

export type RumConfig = {
  applicationId: string;
  clientToken: string;
  site: string;
  env: string;
  version: string;
};

let started = false;

/** Datadog RUM + Session Replay, linked to backend APM traces for same-origin API calls. */
export function DatadogRum({ config }: { config: RumConfig | null }) {
  useEffect(() => {
    if (!config || started) return;
    started = true;
    datadogRum.init({
      applicationId: config.applicationId,
      clientToken: config.clientToken,
      site: config.site,
      service: "bettermy-pitch-web",
      env: config.env,
      version: config.version,
      sessionSampleRate: 100,
      sessionReplaySampleRate: 100,
      trackUserInteractions: true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: "mask-user-input",
      allowedTracingUrls: [(url) => url.startsWith(window.location.origin)],
      traceSampleRate: 100,
    });
  }, [config]);
  return null;
}
