"use client";

import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  value: string;
  onChange: (dataUrl: string) => void;
  onSaving?: boolean;
  width?: number;
  height?: number;
}

export function SignaturePad({ value, onChange, onSaving, width = 280, height = 100 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const getPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;
    if ("touches" in e) {
      const touch = e.touches[0] || (e as TouchEvent).changedTouches?.[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }, []);

  const draw = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      const point = getPoint(e);
      if (!point) return;
      hasDrawnRef.current = true;
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      if ("touches" in e) e.preventDefault();
    },
    [getPoint]
  );

  const startDraw = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const point = getPoint(e);
      if (!point) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;
      isDrawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      if ("touches" in e) e.preventDefault();
    },
    [getPoint]
  );

  const endDraw = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      hasDrawnRef.current = false;
    }
  }, []);

  const save = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    return () => ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [width, height]);

  useEffect(() => {
    const handleEnd = () => endDraw();
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("mouseleave", handleEnd);
    window.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("mouseleave", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [endDraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouseDown = (e: MouseEvent) => startDraw(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleTouchStart = (e: TouchEvent) => {
      startDraw(e);
    };
    const handleTouchMove = (e: TouchEvent) => {
      draw(e);
      e.preventDefault();
    };
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [startDraw, draw]);

  return (
    <div className="space-y-3">
      <div
        className="border rounded-lg bg-white touch-none w-fit"
        dir="ltr"
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none cursor-crosshair block border-0"
          style={{ width: `${width}px`, height: `${height}px`, margin: 0, padding: 0 }}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          נקה
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={onSaving}>
          {onSaving ? "שומר..." : "שמור חתימה"}
        </Button>
      </div>
    </div>
  );
}
