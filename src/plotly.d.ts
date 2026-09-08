/**
 * plotly.js-dist-min ships no type declarations, and @types/plotly.js is a large
 * separate dependency that version-skews against the bundle. We only ever call
 * two functions, so declaring just those is cheaper and cannot drift.
 */
declare module "plotly.js-dist-min" {
  const Plotly: {
    newPlot(
      el: HTMLElement,
      data: unknown[],
      layout?: unknown,
      config?: unknown,
    ): Promise<unknown>;
    purge(el: HTMLElement): void;
  };
  export default Plotly;
}
