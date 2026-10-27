import { World, setWorldConstructor } from "@cucumber/cucumber";

export class AutomationWorld extends World {
  constructor(options) {
    super(options);
    this.browser = undefined;
    this.context = undefined;
    this.page = undefined;
    this.dashboardPage = undefined;
    this.reportPage = undefined;
    this.apiClient = undefined;
  }
}

setWorldConstructor(AutomationWorld);
