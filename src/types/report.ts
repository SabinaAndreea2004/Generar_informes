export interface MaintenanceReport {
  clientName: string;
  clientUrl: string;
  reportMonth: string;
  reportYear: string;
  tasks: {
    wpCore: boolean;
    dbOptimization: boolean;
    monthlyBackup: boolean;
    securityReview: boolean;
  };
  updatedPlugins: string;
  performanceSpeed: string;
  performanceSeo: string;
}
