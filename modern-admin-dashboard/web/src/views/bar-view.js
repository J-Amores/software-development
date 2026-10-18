/**
 * Bar Chart View (/bar)
 * Renders department and category comparative analytics.
 */

import { BaseAnalyticsView } from "./base-analytics-view.js";

export class BarView extends BaseAnalyticsView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    super({
      title: "Bar Chart",
      subtitle: "Department and food category comparative metrics",
      breadcrumb: "Bar Chart",
      dataset: "bar",
      type: "bar",
      apiClient: options.apiClient,
    });
  }
}

export default BarView;
