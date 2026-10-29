import QRCode from "qrcode";

/** SVG QR sebagai string (dibuat server dari data milik kita sendiri, aman untuk di-inline). */
export async function qrSvg(data: string): Promise<string> {
  return QRCode.toString(data, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
}
