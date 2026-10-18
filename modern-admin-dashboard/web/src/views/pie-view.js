/**
 * Pie Chart View (/pie)
 * Renders operational expenditure and category allocation breakdown.
 */

import { BaseAnalyticsView } from "./base-analytics-view.js";

export class PieView extends BaseAnalyticsView {
  /**
   * @param {Object} [options={}]
   * @param {Object} [options.apiClient] - Injectable API client adapter
   */
  constructor(options = {}) {
    super({
      title: "Pie Chart",
      subtitle: "Operational expenditure and category breakdown",
      breadcrumb: "Pie Chart",
      dataset: "pie",
      type: "pie",
      apiClient: options.apiClient,
    });
  }
}

export default PieView;
