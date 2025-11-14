export function getDateRange(timeRange: string): { gte: Date; lte: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeRange) {
      case 'today':
        return {
          gte: today,
          lte: now
        };
        
      case 'this-week': {
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        return {
          gte: monday,
          lte: now
        };
      }
        
      case 'this-month':
        return {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lte: now
        };
        
      case 'last-month': {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          gte: firstDayLastMonth,
          lte: lastDayLastMonth
        };
      }
        
      case 'last-3-months':
        return {
          gte: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          lte: now
        };
        
      case 'this-year':
        return {
          gte: new Date(now.getFullYear(), 0, 1),
          lte: now
        };
        
      case 'last-year':
        return {
          gte: new Date(now.getFullYear() - 1, 0, 1),
          lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
        };
      
      case 'alltime':
        return {
          gte: new Date(2000, 0, 1),
          lte: new Date(2100, 0, 1),
        };
          
      default:
        return {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lte: now
        };
    }
  }