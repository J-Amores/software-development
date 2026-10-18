/**
 * Geography Chart View (/geography)
 * Renders global client traffic and sovereign nation engagement choropleth map.
 */

import { BaseAnalyticsView } from "./base-analytics-view.js";

export class GeographyView extends BaseAnalyticsView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    super({
      title: "Geography Chart",
      subtitle: "Global client traffic and sovereign nation engagement",
      breadcrumb: "Geography Chart",
      dataset: "geography",
      type: "geography",
      apiClient: options.apiClient,
    });
  }
}

export default GeographyView;
