import Chart from 'chart.js/auto';

/**
 * Safely creates a Chart instance by first checking if there's already a chart 
 * attached to the canvas and destroying it if necessary
 * 
 * @param canvasId The ID of the canvas element
 * @param config The Chart configuration
 * @returns The new Chart instance or null if canvas not found
 */
export function createSafeChart(canvasId: string, config: any): Chart | null {
  // Get canvas element
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return null;
  
  // Check for existing Chart instance on this canvas
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    // Destroy the existing chart
    existingChart.destroy();
  }
  
  // Create and return new chart
  return new Chart(canvas, config);
}
