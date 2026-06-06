declare module "bwip-js" {
  type BwipSvgOptions = {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
    textxalign?: string;
    textsize?: number;
    paddingwidth?: number;
    paddingheight?: number;
    eclevel?: string;
  };

  export function toSVG(options: BwipSvgOptions): string;
}
