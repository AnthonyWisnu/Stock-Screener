import React, { useEffect, useRef } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'

/**
 * Chart candlestick dengan overlay EMA, Bollinger Band,
 * dan sub-panel RSI + MACD.
 *
 * Props:
 * - ohlcv: Array<{ timestamp, open, high, low, close, volume }>
 * - indikator: { rsi_14, macd, macd_signal, ema_50, ema_200, bb_upper, bb_lower }
 *   (setiap field adalah array sejajar dengan ohlcv)
 */
export default function ChartCandlestick({ ohlcv, indikator }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !ohlcv?.length) return

    const container = containerRef.current
    const width = container.clientWidth
    const HEIGHT_MAIN = 380
    const HEIGHT_RSI = 120
    const HEIGHT_MACD = 120

    // ---- Chart utama (candlestick + overlay) ----
    const mainChart = createChart(container, {
      width,
      height: HEIGHT_MAIN,
      layout: {
        background: { color: '#030712' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const candleSeries = mainChart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderUpColor: '#16a34a',
      borderDownColor: '#dc2626',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
    })

    const times = ohlcv.map((b) => Math.floor(new Date(b.timestamp).getTime() / 1000))

    candleSeries.setData(
      ohlcv.map((b, i) => ({
        time: times[i],
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
      }))
    )

    // EMA 50
    const ema50Series = mainChart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      title: 'EMA 50',
      priceLineVisible: false,
    })
    ema50Series.setData(
      indikator.ema_50
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean)
    )

    // EMA 200
    const ema200Series = mainChart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 1,
      title: 'EMA 200',
      priceLineVisible: false,
    })
    ema200Series.setData(
      indikator.ema_200
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean)
    )

    // BB Upper
    const bbUpperSeries = mainChart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Upper',
      priceLineVisible: false,
    })
    bbUpperSeries.setData(
      indikator.bb_upper
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean)
    )

    // BB Lower
    const bbLowerSeries = mainChart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB Lower',
      priceLineVisible: false,
    })
    bbLowerSeries.setData(
      indikator.bb_lower
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean)
    )

    mainChart.timeScale().fitContent()

    // ---- Sub-panel RSI ----
    const rsiContainer = document.createElement('div')
    container.appendChild(rsiContainer)

    const rsiChart = createChart(rsiContainer, {
      width,
      height: HEIGHT_RSI,
      layout: {
        background: { color: '#030712' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
        visible: false,
      },
    })

    const rsiSeries = rsiChart.addLineSeries({
      color: '#06b6d4',
      lineWidth: 1,
      title: 'RSI 14',
      priceLineVisible: false,
    })
    rsiSeries.setData(
      indikator.rsi_14
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean)
    )
    // Garis overbought/oversold
    rsiSeries.createPriceLine({ price: 70, color: '#dc2626', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: '70' })
    rsiSeries.createPriceLine({ price: 30, color: '#16a34a', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: '30' })

    rsiChart.timeScale().fitContent()

    // ---- Sub-panel MACD ----
    const macdContainer = document.createElement('div')
    container.appendChild(macdContainer)

    const macdChart = createChart(macdContainer, {
      width,
      height: HEIGHT_MACD,
      layout: {
        background: { color: '#030712' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    const macdLineSeries = macdChart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      title: 'MACD',
      priceLineVisible: false,
    })
    macdLineSeries.setData(
      indikator.macd
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean)
    )

    const macdSignalSeries = macdChart.addLineSeries({
      color: '#f43f5e',
      lineWidth: 1,
      title: 'Signal',
      priceLineVisible: false,
    })
    macdSignalSeries.setData(
      indikator.macd_signal
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean)
    )

    macdChart.timeScale().fitContent()

    // Sinkronisasi crosshair antar chart
    const syncCrosshair = (sourceChart, targetCharts) => {
      sourceChart.subscribeCrosshairMove((param) => {
        targetCharts.forEach((tc) => {
          if (param.time) {
            tc.setCrosshairPosition(0, param.time, tc.series?.[0])
          } else {
            tc.clearCrosshairPosition()
          }
        })
      })
    }
    syncCrosshair(mainChart, [rsiChart, macdChart])
    syncCrosshair(rsiChart, [mainChart, macdChart])
    syncCrosshair(macdChart, [mainChart, rsiChart])

    // Sinkronisasi timeScale scroll
    const syncTimeScale = (source, targets) => {
      source.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) targets.forEach((t) => t.timeScale().setVisibleLogicalRange(range))
      })
    }
    syncTimeScale(mainChart, [rsiChart, macdChart])
    syncTimeScale(rsiChart, [mainChart, macdChart])
    syncTimeScale(macdChart, [mainChart, rsiChart])

    chartRef.current = { mainChart, rsiChart, macdChart, rsiContainer, macdContainer }

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth
      mainChart.applyOptions({ width: w })
      rsiChart.applyOptions({ width: w })
      macdChart.applyOptions({ width: w })
    })
    ro.observe(container)

    return () => {
      ro.disconnect()
      mainChart.remove()
      rsiChart.remove()
      macdChart.remove()
      if (rsiContainer.parentNode) rsiContainer.parentNode.removeChild(rsiContainer)
      if (macdContainer.parentNode) macdContainer.parentNode.removeChild(macdContainer)
      chartRef.current = null
    }
  }, [ohlcv, indikator])

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
      {/* Label sub-panel */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-amber-400"></span> EMA 50
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-violet-500"></span> EMA 200
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-blue-500 border-dashed border-t border-blue-500"></span> Bollinger Band
        </span>
      </div>
      <div ref={containerRef} className="w-full" />
      <div className="px-4 py-1 text-xs text-gray-600 border-t border-gray-800">
        RSI 14
      </div>
      <div className="px-4 py-1 text-xs text-gray-600 border-t border-gray-800">
        MACD (12, 26, 9)
      </div>
    </div>
  )
}
