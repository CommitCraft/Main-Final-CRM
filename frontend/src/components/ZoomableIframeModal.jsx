import React, { useState, useRef } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  ExternalLink,
  Move3D,
  MousePointer,
} from "lucide-react";

const ZoomableIframeModal = ({
  isOpen,
  onClose,
  title,
  url,
  initialZoom = 100,
  minZoom = 50,
  maxZoom = 300,
}) => {
  const [zoom, setZoom] = useState(initialZoom);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Zoom functions
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, minZoom));
  };

  const handleResetZoom = () => {
    setZoom(initialZoom);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomChange = (e) => {
    const newZoom = parseInt(e.target.value);
    setZoom(newZoom);
  };

  // Pan functions
  const handleMouseDown = (e) => {
    if (!isPanning) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isPanning) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Pan mode toggle
  const togglePanMode = () => {
    setIsPanning(!isPanning);
    if (isPanning) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "+":
        case "=":
          if (e.ctrlKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case "0":
          if (e.ctrlKey) {
            e.preventDefault();
            handleResetZoom();
          }
          break;
        case "Escape":
          onClose();
          break;
        case "f":
        case "F11":
          if (!e.ctrlKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Mouse wheel zoom
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom((prev) => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
    }
  };

  if (!isOpen) return null;

  const modalSize = isFullscreen
    ? "fixed inset-0"
    : "fixed inset-4 md:inset-8 lg:inset-16";

  return (
    <div
      className={`${modalSize} bg-black bg-opacity-75 flex items-center justify-center z-50`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full h-full flex flex-col overflow-hidden">
        {/* Header with controls */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title || "Iframe Viewer"}
            </h3>
            {/* {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )} */}
          </div>

          {/* Zoom and control buttons */}
          <div className="flex items-center space-x-2">
            {/* Zoom controls */}
            <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="p-1 rounded text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom out (Ctrl + -)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <input
                type="range"
                min={minZoom}
                max={maxZoom}
                step="10"
                value={zoom}
                onChange={handleZoomChange}
                className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                title={`Zoom: ${zoom}%`}
              />

              <button
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="p-1 rounded text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom in (Ctrl + +)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <span className="text-xs font-mono text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                {zoom}%
              </span>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleResetZoom}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Reset zoom and position (Ctrl + 0)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={togglePanMode}
              className={`p-2 rounded-lg transition-colors ${
                isPanning
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
              title="Toggle pan mode"
            >
              {isPanning ? (
                <Move3D className="h-4 w-4" />
              ) : (
                <MousePointer className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Toggle fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Close (Escape)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Iframe container */}
        <div
          ref={containerRef}
          className={`flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 relative ${
            isPanning ? "cursor-move" : "cursor-default"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
            }}
          >
            <iframe
              ref={iframeRef}
              src={url}
              title={title}
              className="w-full h-full border-0 m-0 p-0 block"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease-out",
                pointerEvents: isPanning ? "none" : "auto",
              }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
            />
          </div>
        </div>

        {/* Footer with instructions */}
        <div className="p-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Ctrl + Mouse wheel: Zoom</span>
              <span>Ctrl + 0: Reset</span>
              <span>F: Fullscreen</span>
            </div>
            <div className="flex items-center space-x-2">
              {isPanning && (
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Pan mode active - Click and drag to move
                </span>
              )}
              <span>Zoom: {zoom}%</span>
              <span className="text-gray-500">•</span>
              <span>
                Range: {minZoom}%-{maxZoom}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomableIframeModal;
