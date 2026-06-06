import { toSVG } from "bwip-js";

export function generateConsignmentNoteBarcodeSvg(content: string) {
  return toSVG({
    bcid: "code128",
    text: content,
    scale: 2,
    height: 12,
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
  });
}

export function generateConsignmentNoteQrSvg(publicTrackingUrl: string) {
  return toSVG({
    bcid: "qrcode",
    text: publicTrackingUrl,
    scale: 3,
    eclevel: "M",
    paddingwidth: 0,
    paddingheight: 0,
  });
}
