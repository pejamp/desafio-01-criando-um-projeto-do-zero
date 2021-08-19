import Link from "next/link";

import styles from './exitPreviewButton.module.scss';

export function ExitPreviewButton() {
  return (
    <aside className={styles.exitButton}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  );
}