/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { DEFAULT_TELEMETRY_ENDPOINT, GLEAN_MAX_SOURCE_TAGS } from "./constants.js";
import type Plugin from "../plugins/index.js";
import { validateHeader, validateURL } from "./utils.js";
import type Uploader from "./upload/uploader.js";
import type { DebugOptions } from "./debug_options.js";

/**
 * Describes how to configure Glean.
 */
export interface ConfigurationInterface {
  // The build identifier generated by the CI system (e.g. "1234/A").
  readonly appBuild?: string,
  // The user visible version string fro the application running Glean.js.
  readonly appDisplayVersion?: string,
  // The server pings are sent to.
  readonly serverEndpoint?: string,
  // Debug configuration.
  debug?: DebugOptions,
  // Optional list of plugins to include in current Glean instance.
  plugins?: Plugin[],
  // The HTTP client implementation to use for uploading pings.
  httpClient?: Uploader,
}

// Important: the `Configuration` should only be used internally by the Glean singleton.
export class Configuration implements ConfigurationInterface {
  // The build identifier generated by the CI system (e.g. "1234/A").
  readonly appBuild?: string;
  // The user visible version string fro the application running Glean.js.
  readonly appDisplayVersion?: string;
  // The server pings are sent to.
  readonly serverEndpoint: string;
  // Debug configuration.
  debug: DebugOptions;
  // The HTTP client implementation to use for uploading pings.
  httpClient?: Uploader;

  constructor(config?: ConfigurationInterface) {
    this.appBuild = config?.appBuild;
    this.appDisplayVersion = config?.appDisplayVersion;

    this.debug = Configuration.sanitizeDebugOptions(config?.debug);

    if (config?.serverEndpoint && !validateURL(config.serverEndpoint)) {
      throw new Error(
        `Unable to initialize Glean, serverEndpoint ${config.serverEndpoint} is an invalid URL.`);
    }
    this.serverEndpoint = (config && config.serverEndpoint)
      ? config.serverEndpoint : DEFAULT_TELEMETRY_ENDPOINT;

    this.httpClient = config?.httpClient;
  }

  static sanitizeDebugOptions(debug?: DebugOptions): DebugOptions {
    const correctedDebugOptions: DebugOptions = debug || {};
    if (debug?.debugViewTag !== undefined && !Configuration.validateDebugViewTag(debug?.debugViewTag)) {
      delete correctedDebugOptions["debugViewTag"];
    }
    if (debug?.sourceTags !== undefined && !Configuration.validateSourceTags(debug?.sourceTags)) {
      delete correctedDebugOptions["sourceTags"];
    }
    return correctedDebugOptions;
  }

  static validateDebugViewTag(tag: string): boolean {
    const validation = validateHeader(tag);
    if (!validation) {
      console.error(
        `"${tag}" is not a valid \`debugViewTag\` value.`,
        "Please make sure the value passed satisfies the regex `^[a-zA-Z0-9-]{1,20}$`."
      );
    }
    return validation;
  }

  static validateSourceTags(tags: string[]): boolean {
    if (tags.length < 1 || tags.length > GLEAN_MAX_SOURCE_TAGS) {
      console.error(`A list of tags cannot contain more than ${GLEAN_MAX_SOURCE_TAGS} elements.`);
      return false;
    }

    for (const tag of tags) {
      if (tag.startsWith("glean")) {
        console.error("Tags starting with `glean` are reserved and must not be used.");
        return false;
      }

      if (!validateHeader(tag)) {
        return false;
      }
    }

    return true;
  }
}
