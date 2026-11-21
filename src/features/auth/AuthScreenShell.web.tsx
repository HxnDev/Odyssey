import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { worldGeoJson } from "@/features/map/geometry";
import { useTheme } from "@/hooks/useTheme";
import { fonts } from "@/lib/theme";
import "./auth.web.css";

function Atlas() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const width = 900;
    const height = 520;
    ctx.clearRect(0, 0, width, height);
    const project = ([lng, lat]: number[]) => [(lng + 180) * 2.5, (82 - lat) * 3.1] as const;

    ctx.strokeStyle = "rgba(255, 227, 199, .16)";
    ctx.beginPath();
    for (let lng = -180; lng <= 180; lng += 30) {
      ctx.moveTo(...project([lng, 82]));
      ctx.lineTo(...project([lng, -70]));
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.moveTo(...project([-180, lat]));
      ctx.lineTo(...project([180, lat]));
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 197, 148, .26)";
    ctx.strokeStyle = "rgba(255, 222, 192, .39)";
    ctx.beginPath();
    for (const { geometry } of worldGeoJson.features) {
      const polygons = geometry?.type === "Polygon" ? [geometry.coordinates]
        : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
      for (const polygon of polygons) {
        for (const [first, ...rest] of polygon) {
          if (!first) continue;
          ctx.moveTo(...project(first));
          for (const point of rest) ctx.lineTo(...project(point));
          ctx.closePath();
        }
      }
    }
    ctx.fill("evenodd");
    ctx.stroke();
  }, []);

  return <canvas ref={canvas} width={900} height={520} aria-hidden="true" className="odyssey-auth-atlas" />;
}

export function AuthScreenShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors, isDark } = useTheme();
  const style = {
    colorScheme: isDark ? "dark" : "light",
    "--auth-paper": colors.paper,
    "--auth-ink": colors.ink,
    "--auth-muted": colors.inkSoft,
    "--auth-display": fonts.displayBlack,
    "--auth-body": fonts.sans,
  } as CSSProperties;
  const isSignIn = title === "Odyssey";

  return (
    <main className="odyssey-auth" style={style}>
      <aside className="odyssey-auth-cover" aria-hidden="true">
        <Atlas />
        <div className="odyssey-auth-cover-copy">
          <p>Every journey matters.</p>
          <span>Keep a record of the places you’ve been and the trips still ahead.</span>
        </div>
      </aside>
      <section className="odyssey-auth-content">
        <div className="odyssey-auth-card">
          <div className="odyssey-auth-brand">
            <Ionicons name="compass-outline" size={25} color={colors.primary} />
            <span>Odyssey</span>
          </div>
          <header>
            <h1>{isSignIn ? "Welcome back" : title}</h1>
            <p>{isSignIn ? "Sign in to open your travel journal." : subtitle}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
