export type RenderCallback = () => void;

export class RenderScheduler {
  private callbacks: Set<RenderCallback> = new Set();
  private scheduled: boolean = false;
  private rafId: number | null = null;

  register(callback: RenderCallback): () => void {
    this.callbacks.add(callback);
    
    // Return cleanup function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  schedule(): void {
    if (this.scheduled) return;
    
    this.scheduled = true;
    this.rafId = requestAnimationFrame(() => {
      this.render();
    });
  }

  private render(): void {
    this.scheduled = false;
    this.rafId = null;
    
    // Execute all registered callbacks
    this.callbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Render callback error:", error);
      }
    });
  }

  cancel(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.scheduled = false;
  }

  clear(): void {
    this.cancel();
    this.callbacks.clear();
  }
}

export const renderScheduler = new RenderScheduler();
