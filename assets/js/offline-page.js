(function () {
  'use strict';

  var retryButton = document.getElementById('retry-button');
  var networkStatus = document.getElementById('network-status');
  if (!retryButton || !networkStatus) return;

  function updateNetworkStatus() {
    var isOnline = navigator.onLine;
    networkStatus.textContent = isOnline
      ? '网络连接似乎已经恢复，可以重新加载页面。'
      : '请检查网络连接，然后重新尝试。';
    retryButton.disabled = false;
    retryButton.textContent = isOnline ? '重新加载' : '重新连接';
  }

  retryButton.addEventListener('click', function () {
    retryButton.disabled = true;
    retryButton.textContent = '正在重试…';
    networkStatus.textContent = '正在检查网络连接…';
    window.location.reload();
  });

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
}());
