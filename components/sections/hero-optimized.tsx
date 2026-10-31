import type { CSSProperties } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { templates } from "@/lib/data/templates";
import styles from "./hero-optimized.module.css";

const CARD_POSITIONS = [
  { x: 3, y: 70, rotation: -10 },
  { x: 12, y: 57, rotation: -8 },
  { x: 22, y: 45, rotation: -6 },
  { x: 33, y: 35, rotation: -4 },
  { x: 43, y: 29, rotation: -2 },
  { x: 57, y: 29, rotation: 2 },
  { x: 67, y: 35, rotation: 4 },
  { x: 78, y: 45, rotation: 6 },
  { x: 88, y: 57, rotation: 8 },
  { x: 97, y: 70, rotation: 10 },
] as const;

export default async function HeroOptimized() {
  const t = await getTranslations("Hero");
  const items = templates.filter((template) => !template.hidden).slice(0, CARD_POSITIONS.length);

  return (
    <section id="top" className={styles.hero} aria-label="NEXORA premium Next.js templates">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.ghost} aria-hidden="true">Templates</div>
      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.eyebrow}>✦ PREMIUM NEXT.JS TEMPLATES</span>
          <h1>Build faster. <em>Launch better.</em></h1>
          <p>{t("description")}</p>
          <div className={styles.actions}>
            <Link href="/templates" className={styles.primaryButton} data-analytics-event="select_content" data-analytics-template="homepage" data-analytics-name="Explore templates">
              {t("exploreTemplates")} <span aria-hidden="true">→</span>
            </Link>
            <Link href="/templates" className={styles.secondaryButton} data-analytics-event="select_content" data-analytics-template="homepage" data-analytics-name="View collection">
              View Collection <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
        <div className={styles.stage} aria-hidden="true">
          {items.map((template, index) => {
            const position = CARD_POSITIONS[index];
            const style = {
              "--x": `${position.x}%`,
              "--y": `${position.y}%`,
              "--rotation": `${position.rotation}deg`,
            } as CSSProperties;

            return (
              <div key={template.slug} className={styles.card} style={style}>
                <span className={styles.cardInner}>
                  <span className={`${styles.face} ${styles.front}`}>
                    <Image
                      src={template.image}
                      alt=""
                      width={128}
                      height={184}
                      sizes="60px"
                      quality={45}
                      loading="lazy"
                    />
                    <span className={styles.shade} />
                  </span>
                  <span className={`${styles.face} ${styles.back}`} aria-hidden="true">
                    <small>{template.category}</small>
                    <b>{template.title}</b>
                    <em>${template.price}</em>
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
