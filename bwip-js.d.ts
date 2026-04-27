declare module "bwip-js" {
  type ToBufferOptions = {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
  };

  const bwipjs: {
    toBuffer(options: ToBufferOptions): Promise<Uint8Array>;
  };

  export default bwipjs;
}
