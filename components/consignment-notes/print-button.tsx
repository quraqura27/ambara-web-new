"use client";

import { Printer } from "lucide-react";

import styles from "./consignment-note-print.module.css";

export function PrintButton() {
  return (
    <button className={styles.printButton} onClick={() => window.print()} type="button">
      <Printer aria-hidden="true" className="h-4 w-4" />
      Print CN
    </button>
  );
}
