/**
 * Line Chart View (/line)
 * Renders longitudinal revenue growth and trend monitoring.
 */

import { BaseAnalyticsView } from "./base-analytics-view.js";

export class LineView extends BaseAnalyticsView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    super({
      title: "Line Chart",
      subtitle: "Longitudinal revenue and trend monitoring",
      breadcrumb: "Line Chart",
      dataset: "line",
      type: "line",
      apiClient: options.apiClient,
    });
  }
}

export default LineView;
