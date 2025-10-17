// Test file with 1000+ lines for testing large code confirmation modal
// This file is generated for testing purposes only

// Utility functions
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  return calculateSum(numbers) / numbers.length;
}

function findMax(numbers) {
  return Math.max(...numbers);
}

function findMin(numbers) {
  return Math.min(...numbers);
}

function sortNumbers(numbers, ascending = true) {
  return ascending
    ? [...numbers].sort((a, b) => a - b)
    : [...numbers].sort((a, b) => b - a);
}

function filterEven(numbers) {
  return numbers.filter(num => num % 2 === 0);
}

function filterOdd(numbers) {
  return numbers.filter(num => num % 2 !== 0);
}

function mapSquare(numbers) {
  return numbers.map(num => num * num);
}

function mapCube(numbers) {
  return numbers.map(num => num * num * num);
}

function isPrime(num) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function reverseString(str) {
  return str.split('').reverse().join('');
}

function isPalindrome(str) {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === reverseString(cleaned);
}

function countVowels(str) {
  return (str.match(/[aeiou]/gi) || []).length;
}

function countConsonants(str) {
  return (str.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

function truncate(str, length) {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^\d{3}-\d{3}-\d{4}$/;
  return re.test(phone);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(date);
}

function getDateDifference(date1, date2) {
  const diff = Math.abs(date1 - date2);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + firstDay.getDay() + 1) / 7);
}

function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function flatten(array) {
  return array.reduce((flat, item) =>
    flat.concat(Array.isArray(item) ? flatten(item) : item), []);
}

function unique(array) {
  return [...new Set(array)];
}

function intersection(arr1, arr2) {
  return arr1.filter(item => arr2.includes(item));
}

function difference(arr1, arr2) {
  return arr1.filter(item => !arr2.includes(item));
}

function union(arr1, arr2) {
  return unique([...arr1, ...arr2]);
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

function sortBy(array, key) {
  return [...array].sort((a, b) =>
    a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0);
}

function pluck(array, key) {
  return array.map(item => item[key]);
}

function omit(obj, keys) {
  return Object.keys(obj)
    .filter(key => !keys.includes(key))
    .reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
}

function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) result[key] = obj[key];
    return result;
  }, {});
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function merge(...objects) {
  return Object.assign({}, ...objects);
}

function isEmpty(value) {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function memoize(func) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

function curry(func) {
  return function curried(...args) {
    if (args.length >= func.length) {
      return func.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

function compose(...funcs) {
  return function(arg) {
    return funcs.reduceRight((result, func) => func(result), arg);
  };
}

function pipe(...funcs) {
  return function(arg) {
    return funcs.reduce((result, func) => func(result), arg);
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(func, maxAttempts = 3, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await func();
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await sleep(delay);
    }
  }
}

function promiseTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

function promiseAllSettled(promises) {
  return Promise.all(
    promises.map(promise =>
      promise
        .then(value => ({ status: 'fulfilled', value }))
        .catch(reason => ({ status: 'rejected', reason }))
    )
  );
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function normalize(value, min, max) {
  return (value - min) / (max - min);
}

function map(value, inMin, inMax, outMin, outMax) {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function parseQueryString(queryString) {
  return Object.fromEntries(new URLSearchParams(queryString));
}

function buildQueryString(params) {
  return new URLSearchParams(params).toString();
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function getLocalStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function setLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function clearLocalStorage() {
  try {
    localStorage.clear();
    return true;
  } catch {
    return false;
  }
}

function getSessionStorage(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
}

function setSessionStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeSessionStorage(key) {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function clearSessionStorage() {
  try {
    sessionStorage.clear();
    return true;
  } catch {
    return false;
  }
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

function readFromClipboard() {
  return navigator.clipboard.readText();
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatNumber(num, decimals = 0) {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(value, total, decimals = 2) {
  return ((value / total) * 100).toFixed(decimals) + '%';
}

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function stringifyJSON(obj, pretty = false) {
  try {
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  } catch {
    return null;
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function unescapeHTML(str) {
  const div = document.createElement('div');
  div.innerHTML = str;
  return div.textContent;
}

function stripHTML(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

function removeQueryParam(param) {
  const url = new URL(window.location);
  url.searchParams.delete(param);
  window.history.pushState({}, '', url);
}

function scrollToTop(smooth = true) {
  window.scrollTo({
    top: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

function scrollToBottom(smooth = true) {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

function scrollToElement(element, smooth = true) {
  element.scrollIntoView({
    behavior: smooth ? 'smooth' : 'auto',
    block: 'start'
  });
}

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function getScrollPercent() {
  const h = document.documentElement;
  const b = document.body;
  const st = 'scrollTop';
  const sh = 'scrollHeight';
  return (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;
}

function addClass(element, className) {
  element.classList.add(className);
}

function removeClass(element, className) {
  element.classList.remove(className);
}

function toggleClass(element, className) {
  element.classList.toggle(className);
}

function hasClass(element, className) {
  return element.classList.contains(className);
}

function getStyle(element, property) {
  return window.getComputedStyle(element).getPropertyValue(property);
}

function setStyle(element, property, value) {
  element.style[property] = value;
}

function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset
  };
}

function getElementSize(element) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight
  };
}

function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  return element;
}

function removeElement(element) {
  element.parentNode.removeChild(element);
}

function replaceElement(oldElement, newElement) {
  oldElement.parentNode.replaceChild(newElement, oldElement);
}

function insertBefore(newElement, referenceElement) {
  referenceElement.parentNode.insertBefore(newElement, referenceElement);
}

function insertAfter(newElement, referenceElement) {
  referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
}

function getParents(element) {
  const parents = [];
  while (element.parentNode) {
    parents.push(element.parentNode);
    element = element.parentNode;
  }
  return parents;
}

function getChildren(element) {
  return Array.from(element.children);
}

function getSiblings(element) {
  return Array.from(element.parentNode.children).filter(child => child !== element);
}

function getNextSiblings(element) {
  const siblings = [];
  while (element.nextElementSibling) {
    siblings.push(element.nextElementSibling);
    element = element.nextElementSibling;
  }
  return siblings;
}

function getPreviousSiblings(element) {
  const siblings = [];
  while (element.previousElementSibling) {
    siblings.push(element.previousElementSibling);
    element = element.previousElementSibling;
  }
  return siblings;
}

function isDescendant(parent, child) {
  let node = child.parentNode;
  while (node) {
    if (node === parent) return true;
    node = node.parentNode;
  }
  return false;
}

function delegate(element, eventType, selector, handler) {
  element.addEventListener(eventType, event => {
    if (event.target.matches(selector)) {
      handler.call(event.target, event);
    }
  });
}

function once(element, eventType, handler) {
  element.addEventListener(eventType, handler, { once: true });
}

function off(element, eventType, handler) {
  element.removeEventListener(eventType, handler);
}

function trigger(element, eventType, detail = null) {
  const event = new CustomEvent(eventType, { detail });
  element.dispatchEvent(event);
}

function ready(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', callback);
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadStyle(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('MSIE') || ua.includes('Trident')) return 'IE';
  return 'Unknown';
}

function detectOS() {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isTablet() {
  return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);
}

function isDesktop() {
  return !isMobile() && !isTablet();
}

function getScreenSize() {
  return {
    width: window.screen.width,
    height: window.screen.height
  };
}

function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

function getOrientation() {
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
}

function onResize(callback) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function onScroll(callback) {
  window.addEventListener('scroll', callback);
  return () => window.removeEventListener('scroll', callback);
}

function getNetworkType() {
  return navigator.connection?.effectiveType || 'unknown';
}

function isOnline() {
  return navigator.onLine;
}

function onOnline(callback) {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

function onOffline(callback) {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}

function getBatteryLevel() {
  return navigator.getBattery?.().then(battery => battery.level) || Promise.resolve(null);
}

function isCharging() {
  return navigator.getBattery?.().then(battery => battery.charging) || Promise.resolve(null);
}

function vibrate(pattern) {
  return navigator.vibrate?.(pattern) || false;
}

function share(data) {
  return navigator.share?.(data) || Promise.reject(new Error('Share not supported'));
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
}

function watchLocation(callback) {
  if (!navigator.geolocation) return null;
  return navigator.geolocation.watchPosition(callback);
}

function clearLocationWatch(id) {
  if (!navigator.geolocation || !id) return;
  navigator.geolocation.clearWatch(id);
}

function requestNotificationPermission() {
  return Notification.requestPermission();
}

function showNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    return new Notification(title, options);
  }
  return null;
}

function requestFullscreen(element = document.documentElement) {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  }
  return Promise.reject(new Error('Fullscreen not supported'));
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  }
  return Promise.reject(new Error('Fullscreen not supported'));
}

function isFullscreen() {
  return !!document.fullscreenElement;
}

function lockOrientation(orientation) {
  if (screen.orientation?.lock) {
    return screen.orientation.lock(orientation);
  }
  return Promise.reject(new Error('Orientation lock not supported'));
}

function unlockOrientation() {
  if (screen.orientation?.unlock) {
    screen.orientation.unlock();
  }
}

function requestWakeLock() {
  if ('wakeLock' in navigator) {
    return navigator.wakeLock.request('screen');
  }
  return Promise.reject(new Error('Wake lock not supported'));
}

function speak(text, options = {}) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, options);
    speechSynthesis.speak(utterance);
  }
}

function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

function getVoices() {
  if ('speechSynthesis' in window) {
    return speechSynthesis.getVoices();
  }
  return [];
}

function startSpeechRecognition(callback) {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.onresult = callback;
    recognition.start();
    return recognition;
  }
  return null;
}

function stopSpeechRecognition(recognition) {
  if (recognition) {
    recognition.stop();
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function fetchJSON(url, options = {}) {
  return fetch(url, options).then(res => res.json());
}

function fetchText(url, options = {}) {
  return fetch(url, options).then(res => res.text());
}

function fetchBlob(url, options = {}) {
  return fetch(url, options).then(res => res.blob());
}

function postJSON(url, data, options = {}) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data),
    ...options
  }).then(res => res.json());
}

function putJSON(url, data, options = {}) {
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(data),
    ...options
  }).then(res => res.json());
}

function deleteJSON(url, options = {}) {
  return fetch(url, {
    method: 'DELETE',
    ...options
  }).then(res => res.json());
}

function uploadFile(url, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    if (onProgress) {
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) {
          onProgress(e.loaded / e.total * 100);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.statusText));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.open('POST', url);
    xhr.send(formData);
  });
}

// Export all functions
export {
  generateRandomString,
  calculateSum,
  calculateAverage,
  findMax,
  findMin,
  sortNumbers,
  filterEven,
  filterOdd,
  mapSquare,
  mapCube,
  isPrime,
  fibonacci,
  factorial,
  gcd,
  lcm,
  reverseString,
  isPalindrome,
  countVowels,
  countConsonants,
  capitalizeWords,
  truncate,
  slugify,
  validateEmail,
  validatePhone,
  formatCurrency,
  formatDate,
  getDateDifference,
  addDays,
  isLeapYear,
  getDaysInMonth,
  getWeekNumber,
  shuffleArray,
  chunk,
  flatten,
  unique,
  intersection,
  difference,
  union,
  groupBy,
  sortBy,
  pluck,
  omit,
  pick,
  deepClone,
  merge,
  isEmpty,
  debounce,
  throttle,
  memoize,
  curry,
  compose,
  pipe,
  sleep,
  retry,
  promiseTimeout,
  promiseAllSettled,
  randomInt,
  randomFloat,
  randomChoice,
  clamp,
  lerp,
  normalize,
  map,
  distance,
  radiansToDegrees,
  degreesToRadians,
  hexToRgb,
  rgbToHex,
  parseQueryString,
  buildQueryString,
  getCookie,
  setCookie,
  deleteCookie,
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  clearLocalStorage,
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage,
  clearSessionStorage,
  copyToClipboard,
  readFromClipboard,
  downloadFile,
  formatBytes,
  formatNumber,
  formatPercent,
  parseJSON,
  stringifyJSON,
  escapeHTML,
  unescapeHTML,
  stripHTML,
  getQueryParam,
  setQueryParam,
  removeQueryParam,
  scrollToTop,
  scrollToBottom,
  scrollToElement,
  isInViewport,
  getScrollPercent,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  getStyle,
  setStyle,
  getElementPosition,
  getElementSize,
  createElement,
  removeElement,
  replaceElement,
  insertBefore,
  insertAfter,
  getParents,
  getChildren,
  getSiblings,
  getNextSiblings,
  getPreviousSiblings,
  isDescendant,
  delegate,
  once,
  off,
  trigger,
  ready,
  loadScript,
  loadStyle,
  detectBrowser,
  detectOS,
  isMobile,
  isTablet,
  isDesktop,
  getScreenSize,
  getViewportSize,
  getOrientation,
  onResize,
  onScroll,
  getNetworkType,
  isOnline,
  onOnline,
  onOffline,
  getBatteryLevel,
  isCharging,
  vibrate,
  share,
  getLocation,
  watchLocation,
  clearLocationWatch,
  requestNotificationPermission,
  showNotification,
  requestFullscreen,
  exitFullscreen,
  isFullscreen,
  lockOrientation,
  unlockOrientation,
  requestWakeLock,
  speak,
  stopSpeaking,
  getVoices,
  startSpeechRecognition,
  stopSpeechRecognition,
  readFile,
  readFileAsDataURL,
  readFileAsArrayBuffer,
  compressImage,
  dataURLtoBlob,
  blobToDataURL,
  fetchJSON,
  fetchText,
  fetchBlob,
  postJSON,
  putJSON,
  deleteJSON,
  uploadFile
};
