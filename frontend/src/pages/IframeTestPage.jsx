import React, { useState } from 'react';
import ZoomableIframeModal from '../components/ZoomableIframeModal';
import { Monitor, ExternalLink } from 'lucide-react';

const IframeTestPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');

  const testSites = [
    {
      title: 'GitHub - Repository',
      url: 'https://github.com',
    },
    {
      title: 'Google - Search Engine',
      url: 'https://google.com',
    },
    {
      title: 'React Documentation',
      url: 'https://react.dev',
    },
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
    },
    {
      title: 'Stack Overflow',
      url: 'https://stackoverflow.com',
    }
  ];

  const openModal = (title, url) => {
    setCurrentTitle(title);
    setCurrentUrl(url);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentUrl('');
    setCurrentTitle('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Zoomable Iframe Modal Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Click on any link below to test the zoomable iframe modal with advanced controls
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Test Websites
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testSites.map((site, index) => (
              <button
                key={index}
                onClick={() => openModal(site.title, site.url)}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {site.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {site.url}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ✨ Enhanced Zoom Controls Available:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">+/-</kbd> buttons with 10% increments for precise control</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">Ctrl + Mouse Wheel</kbd> for smooth zoom (10% steps)</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">Zoom Slider</kbd> with improved range (50%-300%)</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">CSS Transform</kbd> scaling for better performance</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">Pan Mode</kbd> to click and drag the iframe smoothly</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">Reset</kbd> button to restore 100% zoom and center position</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">Fullscreen</kbd> toggle for immersive viewing</li>
              <li>• <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">Transition Effects</kbd> for smooth zoom animations</li>
            </ul>
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs text-green-800 dark:text-green-200">
              <strong>Fixed Issues:</strong> Replaced percentage-based scaling with CSS transform scale for proper iframe zoom behavior
            </div>
          </div>
        </div>
      </div>

      {/* Zoomable Iframe Modal */}
      <ZoomableIframeModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={currentTitle}
        url={currentUrl}
      />
    </div>
  );
};

export default IframeTestPage;