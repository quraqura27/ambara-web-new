import Image from "next/image";

import {
  generateConsignmentNoteBarcodeSvg,
  generateConsignmentNoteQrSvg,
} from "@/lib/consignment-notes/barcode";
import {
  CONSIGNMENT_NOTE_TERMS,
  type ConsignmentNotePieceViewModel,
} from "@/lib/consignment-notes/label";

import styles from "./consignment-note-print.module.css";
import { PrintButton } from "./print-button";

type ConsignmentNotePrintDocumentProps = {
  labels: ConsignmentNotePieceViewModel[];
  missingTrackingNos?: string[];
  title: string;
};

function valueOrDash(value: string | number | null | undefined) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function LabelField({
  label,
  variant,
  value,
}: {
  label: string;
  variant?: "compact";
  value: string | number | null | undefined;
}) {
  return (
    <div className={variant === "compact" ? `${styles.field} ${styles.compactField}` : styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{valueOrDash(value)}</div>
    </div>
  );
}

function PartyBox({
  title,
  titleId,
  name,
  address,
  phone,
}: {
  title: string;
  titleId: string;
  name: string | null;
  address: string | null;
  phone: string | null;
}) {
  return (
    <section aria-labelledby={titleId} className={styles.partyBox}>
      <div className={styles.partyTitle} id={titleId}>
        <span>{title}</span>
      </div>
      <div className={styles.partyName}>{valueOrDash(name)}</div>
      <div className={styles.partyDetail}>{valueOrDash(address)}</div>
      <div className={styles.partyDetail}>Tel: {valueOrDash(phone)}</div>
    </section>
  );
}

function SvgBlock({ className, svg }: { className: string; svg: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function ConsignmentNoteLabel({ label }: { label: ConsignmentNotePieceViewModel }) {
  const barcodeSvg = generateConsignmentNoteBarcodeSvg(label.barcodeContent);
  const qrSvg = generateConsignmentNoteQrSvg(label.publicTrackingUrl);
  const shipperTitleId = `shipper-${label.trackingNo}-${label.pieceNo}`;
  const consigneeTitleId = `consignee-${label.trackingNo}-${label.pieceNo}`;

  return (
    <article aria-label={`Consignment note ${label.trackingNo} piece ${label.pieceSequence}`} className={styles.labelPage}>
      <header className={styles.labelHeader}>
        <div className={styles.brandBlock}>
          <Image
            alt="PT Ambara Artha Globaltrans"
            className={styles.logo}
            height={56}
            priority
            src="/logo-thermal.png"
            unoptimized
            width={360}
          />
          <div>
            <p className={styles.companyName}>PT Ambara Artha Globaltrans</p>
            <p className={styles.website}>www.ambaraartha.com</p>
          </div>
        </div>

        <div className={styles.pieceBox}>
          <div className={styles.pieceLabel}>Piece / Koli</div>
          <div className={styles.pieceValue}>{label.pieceSequence}</div>
        </div>
      </header>

      <section className={styles.trackingBand}>
        <div>
          <div className={styles.eyebrow}>CN / No. Resi</div>
          <div className={styles.trackingNo}>{label.trackingNo}</div>
          <SvgBlock className={styles.barcode} svg={barcodeSvg} />
          <div className={styles.barcodeText}>{label.barcodeContent}</div>
        </div>

        <div className={styles.qrBox}>
          <SvgBlock className={styles.qrGraphic} svg={qrSvg} />
          <div className={styles.qrLabel}>Track / Lacak</div>
        </div>
      </section>

      <section className={styles.routeGrid}>
        <LabelField label="Service / Layanan" value={label.serviceType} />
        <LabelField label="Origin / Asal" value={label.originIata || label.origin} />
        <LabelField label="Destination / Tujuan" value={label.destinationIata || label.destination} />
        <LabelField label="Pcs / Koli" value={label.totalPcs} />
      </section>

      <section className={styles.partyGrid}>
        <PartyBox
          address={label.shipperAddress}
          name={label.shipperName}
          phone={label.shipperPhone}
          title="Shipper / Pengirim"
          titleId={shipperTitleId}
        />
        <PartyBox
          address={label.consigneeAddress}
          name={label.consigneeName}
          phone={label.consigneePhone}
          title="Consignee / Penerima"
          titleId={consigneeTitleId}
        />
      </section>

      <section className={styles.goodsGrid}>
        <LabelField label="Goods / Barang" value={label.goodsDescription} variant="compact" />
        <LabelField label="Commodity / Komoditas" value={label.commodity} variant="compact" />
        <LabelField
          label="Chg Wt / Berat Tagih"
          value={label.chargeableWeight ? `${label.chargeableWeight} kg` : null}
          variant="compact"
        />
      </section>

      <p className={styles.terms}>{CONSIGNMENT_NOTE_TERMS}</p>
    </article>
  );
}

export function ConsignmentNotePrintDocument({
  labels,
  missingTrackingNos = [],
  title,
}: ConsignmentNotePrintDocumentProps) {
  return (
    <div className={styles.printShell}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarTitle}>
          <h1>{title}</h1>
          <p>
            {labels.length} label{labels.length === 1 ? "" : "s"} ready for 100 x 150 mm print.
          </p>
          <p className={styles.printSettings}>
            Paper 100 x 150 mm / 4 x 6 in, Landscape, scale 100%, margins none,
            headers and footers off, fit to page off.
          </p>
        </div>
        <PrintButton />
      </div>

      {missingTrackingNos.length > 0 ? (
        <div className={styles.missingPanel}>
          <strong>Missing shipments:</strong> {missingTrackingNos.join(", ")}
        </div>
      ) : null}

      {labels.length > 0 ? (
        <div className={styles.pages}>
          {labels.map((label) => (
            <ConsignmentNoteLabel
              key={`${label.trackingNo}-${label.pieceNoPadded}-${label.totalPcsPadded}`}
              label={label}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>No consignment note labels to print.</div>
      )}
    </div>
  );
}
