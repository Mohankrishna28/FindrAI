import React, { useState, useEffect } from 'react';
import {
  Search, PlusCircle, ShieldCheck, Radar, Sparkles, Filter, 
  MapPin, Calendar, Tag, CheckCircle2, XCircle, AlertTriangle, 
  Eye, Check, X, RefreshCw, Upload, Camera, ExternalLink,
  Sliders, ChevronRight, User, Award, ArrowRight, Info, Layers,
  Cpu, Activity, Zap, Compass, Building2, HelpCircle, FileText,
  Clock, Share2, CheckSquare, Flame, BarChart3, LayoutGrid, List,
  Smartphone, Laptop, BookOpen, Key, Shirt, Glasses, CheckCheck,
  Server, Link2, Trash2, Lock, Unlock, LogIn, LogOut, UserCheck,
  ShieldAlert, BadgeCheck, Mail, KeyRound, Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';

const DEFAULT_BACKEND_URL = 'https://findrai-zfnm.onrender.com';

let currentApiBase = '';
if (typeof window !== 'undefined') {
  currentApiBase = localStorage.getItem('FINDR_API_BASE') || import.meta.env.VITE_API_BASE_URL || (window.location.hostname.includes('vercel.app') ? DEFAULT_BACKEND_URL : '');
  currentApiBase = currentApiBase.trim().replace(/\/+$/, '');
}

const getApiBase = () => currentApiBase || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? DEFAULT_BACKEND_URL : '');

const LOCAL_ITEMS_KEY = 'FINDR_REPORTED_ITEMS';
const AUTH_STORAGE_KEY = 'FINDR_AUTH_USER';

export const DEMO_ACCOUNTS = {
  admin: {
    email: 'admin@campus.edu',
    password: 'admin123',
    full_name: 'Campus Security Officer',
    role: 'admin'
  },
  user: {
    email: 'student@campus.edu',
    password: 'student123',
    full_name: 'Alex Student',
    role: 'user'
  }
};

const getStoredAuthUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const saveStoredAuthUser = (user) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
  }
};

// Purge any persistent localStorage auth so new browser visits always start at the Login page
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (e) {}
}


const getStoredLocalItems = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalItem = (item) => {
  if (typeof window === 'undefined' || !item) return;
  try {
    const current = getStoredLocalItems();
    const updated = [item, ...current.filter(i => i.id !== item.id)];
    localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (e) {
    console.warn('Could not save local item', e);
  }
};

const removeStoredLocalItem = (itemId) => {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredLocalItems();
    const updated = current.filter(i => i.id !== itemId);
    localStorage.setItem(LOCAL_ITEMS_KEY, JSON.stringify(updated));
  } catch (e) {}
};

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = getApiBase() || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? DEFAULT_BACKEND_URL : '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return base ? `${base}${cleanUrl}` : cleanUrl;
};

// Circular Gauge Component for Match Confidence - Google Styled
function CircularGauge({ score, size = 80, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let strokeColor = '#10b981'; // Google Emerald for >= 80%
  let glowColor = 'rgba(16, 185, 129, 0.25)';
  let bgBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score < 65) {
    strokeColor = '#f59e0b'; // Google Amber for < 65%
    glowColor = 'rgba(245, 158, 11, 0.25)';
    bgBadge = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (score < 80) {
    strokeColor = '#2563eb'; // Google Blue for 65-80%
    glowColor = 'rgba(37, 99, 235, 0.25)';
    bgBadge = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 4px ${glowColor})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-extrabold text-slate-800 tracking-tighter" style={{ fontSize: size * 0.25 }}>
          {score}%
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 -mt-0.5">
          Match
        </span>
      </div>
    </div>
  );
}

// Comprehensive Taxonomy Categories with Criteria for the Dedicated Categories Page

const TAXONOMY_CATEGORIES = [
  {
    id: 'Electronics',
    name: 'Electronics & Computing',
    icon: '💻',
    badge: 'High Value',
    description: 'Laptops, smartphones, tablets, scientific calculators, power banks, and USB drives.',
    primaryCriteria: [
      'Serial Number / IMEI verification',
      'OS Lock screen / Wallpaper identification',
      'Casing, skin, or distinctive sticker placement',
      'Device unlock PIN / Biometric authentication'
    ],
    verificationProof: 'Claimant unlocks device in front of Campus Security or provides original invoice/box IMEI match.',
    multiModalFocus: 'NLP Semantic (35%) + Attribute Specs (20%) + High-resolution visual matching'
  },
  {
    id: 'ID Cards',
    name: 'ID Cards & Wallets',
    icon: '🪪',
    badge: 'Official Credentials',
    description: 'Student campus IDs, driver licenses, ATM/credit cards, wallets, and leather cardholders.',
    primaryCriteria: [
      'Full legal / student registered name',
      'Enrollment / University Roll Number',
      'Academic department & admission year',
      'Wallet material, color, and internal card inventory'
    ],
    verificationProof: 'Instant cross-validation against University Registrar ERP database and active student portal login.',
    multiModalFocus: 'Attribute text extraction + Student database cross-check (Instant high confidence)'
  },
  {
    id: 'Books',
    name: 'Books & Academic Notes',
    icon: '📚',
    badge: 'Academic Assets',
    description: 'Course textbooks, reference volumes, lab manuals, class notes, and assignment binders.',
    primaryCriteria: [
      'Exact book title, author, and edition',
      'Handwritten inscriptions on inner title flyleaf',
      'Highlighter color notes and page sticky flags',
      'Subject code, branch, and semester notation'
    ],
    verificationProof: 'Verification of handwritten signatures or specific notes on stated page numbers.',
    multiModalFocus: 'Title NLP Semantic proximity (45%) + Handwritten signature identification'
  },
  {
    id: 'Audio',
    name: 'Audio & Wireless Gadgets',
    icon: '🎧',
    badge: 'Popular Gadgets',
    description: 'AirPods, wireless earbuds, over-ear headphones, neckbands, and Bluetooth portable speakers.',
    primaryCriteria: [
      'Custom Bluetooth device name broadcast',
      'Charging case color, silicone sleeve, or scratches',
      'Serial number inside case lid / under headband',
      'Left/Right bud model code and battery indicator color'
    ],
    verificationProof: 'Successful live Bluetooth pairing with the student’s authenticated phone.',
    multiModalFocus: 'Brand & Color ontology match (35%) + Vision feature match for case stickers'
  },
  {
    id: 'Personal',
    name: 'Personal Items & Drinkware',
    icon: '🧴',
    badge: 'Daily Essentials',
    description: 'Insulated stainless-steel flasks, water bottles, umbrellas, spectacles, prescription sunglasses, watches.',
    primaryCriteria: [
      'Brand manufacturer (Hydro Flask, Cello, Fastrack)',
      'Specific color shade and finish (matte, gloss)',
      'Identifiable dents, scratches, or custom stickers',
      'Prescription optical power for eyewear'
    ],
    verificationProof: 'Precise description of stickers, scratches, or eyewear optical power certificate.',
    multiModalFocus: 'Visual Computer Vision (35%) + Color / Attribute extraction (25%)'
  },
  {
    id: 'Keys',
    name: 'Keys & Campus Access',
    icon: '🔑',
    badge: 'Security Items',
    description: 'Hostel room keys, two-wheeler keys, bicycle U-locks, locker keys, and customized keychains.',
    primaryCriteria: [
      'Exact number of keys on the ring',
      'Keychain mascot / miniature figurine / lanyard tag',
      'Key blank manufacturer (Godrej, Yale, etc.)',
      'Remote fob buttons and physical key cuts'
    ],
    verificationProof: 'Physical trial of the key in the student hostel room lock or vehicle ignition supervised by security.',
    multiModalFocus: 'Computer vision key-count & keychain token detection + Attribute color matching'
  },
  {
    id: 'Clothing',
    name: 'Clothing & Backpacks',
    icon: '🎒',
    badge: 'Apparel & Storage',
    description: 'College backpacks, laptop bags, sports duffels, university hoodies, jackets, lab coats, and caps.',
    primaryCriteria: [
      'Brand logo, size tag, and color combination',
      'Number of zipper compartments and pockets',
      'Distinctive badges, embroidery, or keychains attached',
      'Itemized list of contents inside inner compartments'
    ],
    verificationProof: 'Accurate description of unannounced items inside pockets before unzipping.',
    multiModalFocus: 'Visual texture/color extraction (40%) + Compartment attribute matching'
  }
];

export default function App() {
  // Navigation Tabs: explore, radar, categories, report, heatmap, admin
  const [activeTab, setActiveTab] = useState('explore');
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({
    total_lost: 0,
    total_found: 0,
    total_reports: 0,
    resolved_items: 0,
    high_confidence_matches: 0,
    total_matches: 0,
    pending_claims: 0
  });

  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [claimModalData, setClaimModalData] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters for browse / explore view
  const [browseType, setBrowseType] = useState('ALL');
  const [browseCategory, setBrowseCategory] = useState('ALL');
  const [browseSearch, setBrowseSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [radarThreshold, setRadarThreshold] = useState(60);

  // Interactive Weight Simulation inside Modal
  const [customWeights, setCustomWeights] = useState({
    w_desc: 35,
    w_img: 30,
    w_attr: 15,
    w_loc: 10,
    w_time: 10
  });

  // Report Form State
  const [reportStep, setReportStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'LOST',
    title: '',
    category: 'Electronics',
    brand: '',
    color: 'Black',
    location: '',
    date_lost_or_found: new Date().toISOString().split('T')[0],
    description: '',
    reporter_name: '',
    reporter_contact: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Claim Form State
  const [claimForm, setClaimForm] = useState({
    claimant_name: '',
    claimant_contact: '',
    proof_description: ''
  });

  // Authentication State (Student vs Security Admin)
  const [authUser, setAuthUser] = useState(getStoredAuthUser);
  const [authPortalRole, setAuthPortalRole] = useState('user'); // 'user' | 'admin'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register'
  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    full_name: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin filter
  const [adminTab, setAdminTab] = useState('claims');

  // Backend API URL State & Local Configuration
  const [apiBaseUrl, setApiBaseUrl] = useState(getApiBase);
  const [customApiInput, setCustomApiInput] = useState(getApiBase);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiConnected, setApiConnected] = useState(null);
  const [imgFailed, setImgFailed] = useState({});

  const handleLogin = async (e, forcedRole = null, forcedCreds = null) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const targetRole = forcedRole || authPortalRole;
    const email = (forcedCreds ? forcedCreds.email : authFormData.email).trim().toLowerCase();
    const password = forcedCreds ? forcedCreds.password : authFormData.password;

    if (!email || !password) {
      setAuthError('Email and password are required.');
      setAuthLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: targetRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthUser(data.user);
        saveStoredAuthUser(data.user);
        showNotification(
          `Welcome, ${data.user.full_name}!`,
          data.user.role === 'admin'
            ? 'Authenticated as Campus Security Administrator'
            : 'Authenticated as Campus Student / User'
        );
        triggerConfetti();
        setAuthFormData({ email: '', password: '', full_name: '' });
        if (data.user.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('explore');
        }
        return;
      } else {
        setAuthError(data.detail || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      // Offline fallback for demo accounts
      if (email === DEMO_ACCOUNTS.admin.email && password === DEMO_ACCOUNTS.admin.password) {
        if (targetRole !== 'admin') {
          setAuthError('This is an Administrator account. Please select the Security Admin Portal tab.');
          setAuthLoading(false);
          return;
        }
        const demoAdmin = DEMO_ACCOUNTS.admin;
        setAuthUser(demoAdmin);
        saveStoredAuthUser(demoAdmin);
        showNotification('Welcome, Officer!', 'Logged in as Campus Security Administrator (Demo Mode)');
        triggerConfetti();
        setActiveTab('admin');
        return;
      } else if (email === DEMO_ACCOUNTS.user.email && password === DEMO_ACCOUNTS.user.password) {
        if (targetRole === 'admin') {
          setAuthError('Access Denied: Student accounts do not possess administrator approval privileges.');
          setAuthLoading(false);
          return;
        }
        const demoUser = DEMO_ACCOUNTS.user;
        setAuthUser(demoUser);
        saveStoredAuthUser(demoUser);
        showNotification('Welcome, Student!', 'Logged in as Campus Student (Demo Mode)');
        triggerConfetti();
        setActiveTab('explore');
        return;
      } else {
        setAuthError('Could not connect to authentication server. Click one of the Demo Quick-Login buttons below.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const email = authFormData.email.trim().toLowerCase();
    const password = authFormData.password;
    const full_name = authFormData.full_name.trim();

    if (!email || !password || !full_name) {
      setAuthError('Full name, email, and password are required.');
      setAuthLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name, role: authPortalRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthUser(data.user);
        saveStoredAuthUser(data.user);
        showNotification('Account Created!', `Welcome to FindrAI, ${data.user.full_name}!`);
        triggerConfetti();
        setAuthFormData({ email: '', password: '', full_name: '' });
        if (data.user.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('explore');
        }
      } else {
        setAuthError(data.detail || 'Registration failed.');
      }
    } catch (err) {
      const fallbackUser = { id: Date.now(), email, full_name, role: authPortalRole };
      setAuthUser(fallbackUser);
      saveStoredAuthUser(fallbackUser);
      showNotification('Account Created!', `Welcome, ${fallbackUser.full_name}!`);
      triggerConfetti();
      if (authPortalRole === 'admin') setActiveTab('admin');
      else setActiveTab('explore');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    saveStoredAuthUser(null);
    showNotification('Signed Out', 'You have been logged out.');
    if (activeTab === 'admin') {
      setActiveTab('explore');
    }
  };

  const handleQuickDemoLogin = (role) => {
    setAuthPortalRole(role);
    const creds = role === 'admin' ? DEMO_ACCOUNTS.admin : DEMO_ACCOUNTS.user;
    setAuthFormData({ email: creds.email, password: creds.password, full_name: creds.full_name });
    handleLogin(null, role, creds);
  };

  const handleApproveItem = async (itemId, approvalStatus = 'APPROVED', newStatus = null) => {
    try {
      const payload = { approval_status: approvalStatus };
      if (newStatus) payload.status = newStatus;
      const res = await fetch(`${getApiBase()}/api/items/${itemId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showNotification(
          approvalStatus === 'APPROVED' ? 'Item Verified & Approved!' : 'Item Status Updated',
          `Article #${itemId} status updated to ${approvalStatus}.`,
          approvalStatus === 'APPROVED' ? 'success' : 'error'
        );
        if (approvalStatus === 'APPROVED') triggerConfetti();
        fetchItems();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, approval_status: approvalStatus, status: newStatus || i.status } : i));
      showNotification('Item Updated', `Article #${itemId} updated locally.`);
    }
  };


  const handleDeleteItem = async (itemId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this article record?')) return;
    removeStoredLocalItem(itemId);
    try {
      const res = await fetch(`${getApiBase()}/api/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Item Removed', 'The article report has been removed.');
        fetchItems();
        fetchStats();
        fetchMatches();
      }
    } catch (err) {
      console.error(err);
      fetchItems();
    }
  };

  const handleSaveApiUrl = async (newUrl) => {
    const cleanUrl = (newUrl || '').trim().replace(/\/+$/, '');
    setApiTesting(true);
    try {
      const testRes = await fetch(`${cleanUrl}/api/health?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (testRes.ok) {
        if (typeof window !== 'undefined') {
          if (cleanUrl) localStorage.setItem('FINDR_API_BASE', cleanUrl);
          else localStorage.removeItem('FINDR_API_BASE');
        }
        currentApiBase = cleanUrl;
        setApiBaseUrl(cleanUrl);
        setApiConnected(true);
        showNotification('Backend Connected!', `Connected to ${cleanUrl || 'local proxy'}`);
        setApiModalOpen(false);
        fetchStats(cleanUrl);
        fetchMatches(cleanUrl);
        fetchItems(cleanUrl);
        fetchClaims(cleanUrl);
      } else {
        alert('Connected to host, but health check failed. Verify the URL is your FastAPI backend.');
        setApiConnected(false);
      }
    } catch (e) {
      alert(`Could not connect to ${cleanUrl}. Check the URL and verify the backend is online.`);
      setApiConnected(false);
    } finally {
      setApiTesting(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchStats();
    fetchMatches();
    fetchItems();
    fetchClaims();
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });
  };

  const showNotification = (title, message, type = 'success') => {
    setNotification({ title, message, type });
    setTimeout(() => setNotification(null), 6000);
  };

  const fetchStats = async (base = getApiBase()) => {
    try {
      const res = await fetch(`${base}/api/stats?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setApiConnected(true);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
      setApiConnected(false);
    }
  };

  const fetchMatches = async (base = getApiBase()) => {
    try {
      setLoading(true);
      const res = await fetch(`${base}/api/matches?min_score=40&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (e) {
      console.error('Failed to load matches', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (base = getApiBase()) => {
    try {
      const res = await fetch(`${base}/api/items?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const backendItems = await res.json();
        const localItems = getStoredLocalItems();
        // Merge backend items with local items to ensure reports never disappear across cold starts
        const backendIds = new Set(backendItems.map(i => i.id));
        const merged = [...backendItems, ...localItems.filter(i => !backendIds.has(i.id))];
        setItems(merged);
      }
    } catch (e) {
      console.error('Failed to load items', e);
      const localItems = getStoredLocalItems();
      if (localItems.length > 0) {
        setItems(localItems);
      }
    }
  };

  const fetchClaims = async (base = getApiBase()) => {
    try {
      const res = await fetch(`${base}/api/claims?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setClaims(data);
      }
    } catch (e) {
      console.error('Failed to load claims', e);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'image') {
          if (formData.image) payload.append('image', formData.image);
        } else {
          payload.append(key, formData[key] || '');
        }
      });

      const res = await fetch(`${getApiBase()}/api/items`, {
        method: 'POST',
        body: payload
      });

      const data = await res.json();
      if (data.success) {
        if (data.item) {
          saveLocalItem(data.item);
        }

        showNotification(
          'Report Submitted & AI Match Matrix Updated!',
          data.high_confidence_detected 
            ? `⚡ High Match Found (${data.top_match_score}% confidence)! Redirecting to AI Match Radar.` 
            : `Item indexed. ${data.matches_count} candidates analyzed.`
        );

        if (data.high_confidence_detected) triggerConfetti();

        // Reset form
        setFormData({
          type: 'LOST',
          title: '',
          category: 'Electronics',
          brand: '',
          color: 'Black',
          location: '',
          date_lost_or_found: new Date().toISOString().split('T')[0],
          description: '',
          reporter_name: '',
          reporter_contact: '',
          image: null
        });
        setImagePreview(null);
        setReportStep(1);

        await Promise.all([
          fetchStats(),
          fetchMatches(),
          fetchItems()
        ]);

        if (data.high_confidence_detected) {
          setActiveTab('radar');
        } else {
          setActiveTab('explore');
        }
      } else {
        alert('Error: ' + (data.detail || 'Failed to submit report'));
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && !getApiBase()) {
        setApiModalOpen(true);
      }
      alert('Network or server error while submitting report. If running on Vercel, click "Connect Backend API" at the top to link your backend.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimModalData) return;

    try {
      const res = await fetch(`${getApiBase()}/api/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: claimModalData.item.id,
          match_id: claimModalData.match ? claimModalData.match.id : null,
          claimant_name: claimForm.claimant_name,
          claimant_contact: claimForm.claimant_contact,
          proof_description: claimForm.proof_description
        })
      });

      if (res.ok) {
        showNotification(
          'Verification Claim Registered!',
          'Ownership claim dispatched to Campus Security. Case status changed to Pending Verification.',
          'success'
        );
        triggerConfetti();
        setClaimModalData(null);
        setClaimForm({ claimant_name: '', claimant_contact: '', proof_description: '' });
        fetchStats();
        fetchMatches();
        fetchItems();
        fetchClaims();
      } else {
        alert('Failed to submit claim');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting claim');
    }
  };

  const handleReviewClaim = async (claimId, status) => {
    try {
      const res = await fetch(`${getApiBase()}/api/claims/${claimId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          admin_notes: `Authorized by Campus Security Administrator on ${new Date().toLocaleDateString()}`
        })
      });

      if (res.ok) {
        showNotification(
          `Claim ${status}!`,
          `Incident records and matching states updated.`,
          status === 'APPROVED' ? 'success' : 'error'
        );
        if (status === 'APPROVED') triggerConfetti();
        fetchClaims();
        fetchStats();
        fetchMatches();
        fetchItems();
      }
    } catch (e) {
      console.error('Error reviewing claim', e);
    }
  };

  const handleMatchStatus = async (matchId, newStatus) => {
    try {
      const res = await fetch(`${getApiBase()}/api/matches/${matchId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showNotification(`Match ${newStatus}`, `Match record updated to ${newStatus}.`);
        if (newStatus === 'CONFIRMED') triggerConfetti();
        fetchMatches();
        fetchStats();
        if (selectedMatch && selectedMatch.id === matchId) {
          setSelectedMatch(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      await fetch(`${getApiBase()}/api/recompute-all`, { method: 'POST' });
      fetchStats();
      fetchMatches();
      fetchItems();
      fetchClaims();
      showNotification('AI Engine Synchronized', 'Recalculated similarity vectors across active articles.');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to purge all records from the database? This cannot be undone.')) return;
    try {
      setLoading(true);
      await fetch(`${getApiBase()}/api/clear`, { method: 'POST' });
      fetchStats();
      fetchMatches();
      fetchItems();
      fetchClaims();
      showNotification('Database Cleared', 'All real-time items and claims have been cleared.');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered items for Directory / Explore view
  const filteredItems = items.filter(item => {
    if (browseType !== 'ALL' && item.type !== browseType) return false;
    if (browseCategory !== 'ALL' && !item.category.toLowerCase().includes(browseCategory.toLowerCase())) return false;
    if (browseSearch) {
      const q = browseSearch.toLowerCase();
      const matchText = `${item.title} ${item.description} ${item.location} ${item.color} ${item.brand || ''}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const filteredMatches = matches.filter(m => m.total_score >= radarThreshold);

  // Compute description strength score for Report wizard
  const descScore = Math.min(100, Math.round(
    (formData.title.length > 5 ? 20 : 0) +
    (formData.description.length > 20 ? 30 : 0) +
    (formData.color ? 15 : 0) +
    (formData.location ? 15 : 0) +
    (formData.image ? 20 : 0)
  ));

  return (
    <div className="min-h-screen pb-20">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-fade-in glass-panel p-4 shadow-xl border-blue-200 bg-white/95 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-sm">{notification.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Modern Clean Institutional System Status */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 border-b border-blue-100/80 px-4 py-1.5 text-center text-[11px] text-slate-600 flex items-center justify-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-blue-700 font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> FindrAI Intelligent Campus Retrieval Network
        </span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span className="hidden sm:inline text-slate-500">Multi-Modal Semantic NLP & Computer Vision Architecture</span>
        <button
          onClick={() => {
            setCustomApiInput(apiBaseUrl || 'https://findrai-zfnm.onrender.com');
            setApiModalOpen(true);
          }}
          className={`px-2.5 py-0.5 rounded-full font-medium text-[10px] border flex items-center gap-1.5 transition cursor-pointer ${
            apiConnected === true 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : apiConnected === false
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
          title="Click to configure backend API URL"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${apiConnected === true ? 'bg-emerald-500' : apiConnected === false ? 'bg-rose-500 animate-ping' : 'bg-blue-500'}`} />
          {apiBaseUrl ? (apiConnected ? 'Backend Connected' : 'Backend Offline (Click to edit)') : '⚙️ Connect Backend API'}
        </button>
      </div>

      {/* Prominent Alert Banner when on Vercel and no Backend Connected */}
      {(!apiBaseUrl && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 flex items-center justify-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span><strong>Action Required:</strong> Frontend is not linked to your backend API. Submit report or claims require backend connection.</span>
          <button
            onClick={() => {
              setCustomApiInput('https://findrai-zfnm.onrender.com');
              setApiModalOpen(true);
            }}
            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition"
          >
            Connect Backend Now
          </button>
        </div>
      )}

      {/* Main App Navigation Bar - Google Themed */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/95 border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => {
              if (authUser) {
                setActiveTab(authUser.role === 'admin' ? 'admin' : 'explore');
              }
            }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-md shadow-blue-500/25 flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-blue-50/50 radar-sweep-beam" />
                  <Radar className="w-5 h-5 text-blue-600 relative z-10" />
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white animate-ping" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-slate-900 font-['Outfit']">
                  Findr<span className="text-gradient-hero">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {authUser ? (authUser.role === 'admin' ? 'CAMPUS SECURITY ADMIN' : 'STUDENT PORTAL') : 'CAMPUS INTELLIGENCE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Multi-Modal Semantic Matching & Campus Recovery Platform</p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          {authUser ? (
            /* AUTHENTICATED NAVIGATION: Explore, Radar, Categories, Report, Admin Desk (if admin) */
            <div className="flex flex-wrap items-center gap-2.5">
              <nav className="flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200 shadow-sm text-xs font-semibold overflow-x-auto max-w-full">
                {/* Admin Desk - STRICTLY ONLY FOR ADMINS */}
                {authUser.role === 'admin' && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab === 'admin' 
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25 font-bold' 
                        : 'text-amber-800 hover:text-amber-900 hover:bg-amber-100/80 font-bold'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-300" />
                    <span>Admin Desk</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-slate-900">
                      OFFICER
                    </span>
                    {stats.pending_claims > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </button>
                )}

                {/* Option 1: Explore Directory */}
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'explore' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-white/70'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Explore</span>
                  {items.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'explore' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {items.length}
                    </span>
                  )}
                </button>

                {/* Option 2: AI Match Radar */}
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'radar' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-white/70'
                  }`}
                >
                  <Radar className="w-4 h-4" />
                  <span>AI Matching</span>
                  {filteredMatches.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'radar' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {filteredMatches.length}
                    </span>
                  )}
                </button>

                {/* Option 3: Categories & Criteria */}
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'categories' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-white/70'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Categories</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {TAXONOMY_CATEGORIES.length}
                  </span>
                </button>

                {/* Option 4: Report Item */}
                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'report' 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-white/70'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Item</span>
                </button>
              </nav>

              {/* User Profile Pill & Sign Out Button */}
              <div className="flex items-center gap-2 p-1 pl-3 pr-2 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                    authUser.role === 'admin' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {authUser.role === 'admin' ? '🛡️' : '🎓'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-800 text-[11px] truncate max-w-[120px]">
                        {authUser.full_name || authUser.email}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                        authUser.role === 'admin'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}>
                        {authUser.role === 'admin' ? 'Admin' : 'Student'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  title="Sign out and return to entrance login page"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* NON-AUTHENTICATED HEADER: Quick Demo Buttons & Lock indicator */
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('user')}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🎓</span>
                  <span>Student Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🛡️</span>
                  <span>Admin Demo</span>
                </button>
              </div>

              <span className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Login Required</span>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        {!authUser ? (
          /* ============================================================== */
          /* ENTRANCE GATE: DEDICATED LOGIN PAGE AT THE VERY BEGINNING       */
          /* (Options like Report, Explore, AI Matching locked until login) */
          /* ============================================================== */
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-4">
            {/* Header Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Multi-Role Access Control</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
                Campus Portal Authentication
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                Sign in to your account. Select your portal below based on your role: Student / User or Campus Security Administrator.
              </p>
            </div>

            {/* Dual Role Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Student / User Card */}
              <div 
                onClick={() => {
                  setAuthPortalRole('user');
                  setAuthError('');
                }}
                className={`glass-panel p-6 rounded-3xl cursor-pointer transition-all border-2 relative overflow-hidden ${
                  authPortalRole === 'user'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50/90 via-white to-sky-50/70 shadow-lg shadow-blue-500/10'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                {authPortalRole === 'user' && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                    <Check className="w-3 h-3" /> Selected Mode
                  </div>
                )}

                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-['Outfit']">
                  Student & Campus Member
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  For students, faculty, and university members. Report lost personal articles, browse discovered items, search the AI Match Radar, and file ownership verification claims.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Regular Member Access</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickDemoLogin('user');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>1-Click Student Login</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Security Admin Card */}
              <div 
                onClick={() => {
                  setAuthPortalRole('admin');
                  setAuthError('');
                }}
                className={`glass-panel p-6 rounded-3xl cursor-pointer transition-all border-2 relative overflow-hidden ${
                  authPortalRole === 'admin'
                    ? 'border-amber-500 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 shadow-lg shadow-amber-500/10'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
              >
                {authPortalRole === 'admin' && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                    <Check className="w-3 h-3" /> Selected Mode
                  </div>
                )}

                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 font-['Outfit']">
                  Campus Security & Staff Admin
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  For authorized Campus Security Officers & Staff administrators. <strong>Approve reported items</strong>, evaluate claimant proof, authorize article releases, confirm AI matches, and audit records.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-amber-800 font-semibold">Elevated Approval Authority</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickDemoLogin('admin');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>1-Click Admin Login</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Authentication Form Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl bg-white border-slate-200 shadow-xl max-w-xl mx-auto">
              {/* Form Mode Header Tabs (Sign In vs Register) */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      authPortalRole === 'admin'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {authPortalRole === 'admin' ? '🛡️ Admin Desk Portal' : '🎓 Student Portal'}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit'] mt-1">
                    {authMode === 'signin' 
                      ? (authPortalRole === 'admin' ? 'Authenticate Security Admin' : 'Student & Member Sign In')
                      : (authPortalRole === 'admin' ? 'Register Security Staff' : 'Create Student Account')
                    }
                  </h3>
                </div>

                <div className="flex p-1 rounded-xl bg-slate-100 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAuthError(''); }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      authMode === 'signin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      authMode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {authError && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={authMode === 'signin' ? handleLogin : handleRegister} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder={authPortalRole === 'admin' ? 'e.g. Officer James Vance' : 'e.g. Alex Student'}
                        value={authFormData.full_name}
                        onChange={(e) => setAuthFormData({ ...authFormData, full_name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Campus Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder={authPortalRole === 'admin' ? 'admin@campus.edu' : 'student@campus.edu'}
                      value={authFormData.email}
                      onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={authFormData.password}
                      onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm font-mono"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={authLoading}
                  className={`w-full py-3 rounded-xl text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                    authPortalRole === 'admin'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/25'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
                  }`}
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      {authPortalRole === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                      <span>
                        {authMode === 'signin'
                          ? (authPortalRole === 'admin' ? 'Sign In as Security Administrator' : 'Sign In as Student / User')
                          : (authPortalRole === 'admin' ? 'Create Administrator Account' : 'Create Student Account')
                        }
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Demo Fill Quick Buttons */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <p className="text-[11px] font-bold text-slate-600">Quick Test Credentials:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthPortalRole('user');
                      setAuthFormData({ email: DEMO_ACCOUNTS.user.email, password: DEMO_ACCOUNTS.user.password, full_name: DEMO_ACCOUNTS.user.full_name });
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 text-left transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">🎓</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">Fill Student Credentials</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{DEMO_ACCOUNTS.user.email}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthPortalRole('admin');
                      setAuthFormData({ email: DEMO_ACCOUNTS.admin.email, password: DEMO_ACCOUNTS.admin.password, full_name: DEMO_ACCOUNTS.admin.full_name });
                    }}
                    className="p-2.5 rounded-xl bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 text-left transition flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">🛡️</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-900">Fill Admin Credentials</p>
                      <p className="text-[10px] text-amber-700 font-mono truncate">{DEMO_ACCOUNTS.admin.email}</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Why Users and Admin are kept different - Roles Comparison Table */}
            <div className="glass-panel p-6 border-slate-200 bg-white/95 rounded-3xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900 font-['Outfit']">
                  Role Capabilities & Approval Privileges Matrix
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Campus item safety protocol requires clear separation between community reporting and administrative approvals:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="p-3">Platform Capability</th>
                      <th className="p-3">🎓 Student / Member</th>
                      <th className="p-3">🛡️ Campus Security Admin</th>
                      <th className="p-3">Governance Rule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">Browse Campus Directory</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Full Access</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Full Access</td>
                      <td className="p-3 text-slate-500">Public transparency for quick recovery</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">Report Lost or Found Articles</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Allowed</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Allowed</td>
                      <td className="p-3 text-slate-500">Indexed into multi-modal semantic matrix</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">AI Match Radar & Similarity</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Allowed</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Allowed</td>
                      <td className="p-3 text-slate-500">Calculates NLP & Computer Vision scores</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">Submit Item Ownership Claim</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Allowed (Files Proof)</td>
                      <td className="p-3 text-emerald-700 font-bold">✓ Allowed</td>
                      <td className="p-3 text-slate-500">Claimant provides serial, PIN, marks</td>
                    </tr>
                    <tr className="hover:bg-amber-50/30 bg-amber-50/10">
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-amber-600" />
                        Approve Reported Articles & Mark Verified
                      </td>
                      <td className="p-3 text-rose-600 font-bold">❌ Restricted</td>
                      <td className="p-3 text-emerald-700 font-bold bg-emerald-50/50">✓ Full Authority</td>
                      <td className="p-3 text-slate-700 font-medium">Prevents fraudulent or spam reports</td>
                    </tr>
                    <tr className="hover:bg-amber-50/30 bg-amber-50/10">
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Authorize Ownership Claims & Release Items
                      </td>
                      <td className="p-3 text-rose-600 font-bold">❌ Restricted</td>
                      <td className="p-3 text-emerald-700 font-bold bg-emerald-50/50">✓ Full Authority</td>
                      <td className="p-3 text-slate-700 font-medium">Security verifies physical proof & hands over</td>
                    </tr>
                    <tr className="hover:bg-amber-50/30 bg-amber-50/10">
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        Confirm / Reject AI Matches
                      </td>
                      <td className="p-3 text-rose-600 font-bold">❌ Restricted</td>
                      <td className="p-3 text-emerald-700 font-bold bg-emerald-50/50">✓ Full Authority</td>
                      <td className="p-3 text-slate-700 font-medium">Official determination of item pairs</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">Database Purge & Vector Recalibration</td>
                      <td className="p-3 text-rose-600 font-bold">❌ Restricted</td>
                      <td className="p-3 text-emerald-700 font-bold bg-emerald-50/50">✓ Full Authority</td>
                      <td className="p-3 text-slate-500">Maintenance & institutional controls</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* AUTHENTICATED WORKSPACE: FULL ACCESS TO UNLOCKED OPTIONS       */
          /* ============================================================== */
          <>
            {/* ============================================================== */}
        {/* PAGE 1: EXPLORE DIRECTORY (Campus Items Explorer)             */}
        {/* ============================================================== */}
        {activeTab === 'explore' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Hero Banner for Explore */}
            <div className="glass-panel p-6 border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-white to-sky-50/60 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
                  <Search className="w-4 h-4" />
                  <span>Campus Lost & Found Directory</span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-['Outfit']">
                  Explore Campus Articles
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Browse, search, and inspect reported lost property and secured recovered articles across university buildings.
                </p>
              </div>

              {/* Quick Stat Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-center min-w-[85px]">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Items</span>
                  <span className="text-lg font-extrabold text-slate-900">{stats.total_reports || items.length}</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 shadow-sm text-center min-w-[85px]">
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Lost</span>
                  <span className="text-lg font-extrabold text-rose-700">{stats.total_lost}</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 shadow-sm text-center min-w-[85px]">
                  <span className="text-[10px] text-blue-600 uppercase font-bold block">Found</span>
                  <span className="text-lg font-extrabold text-blue-700">{stats.total_found}</span>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm text-center min-w-[85px]">
                  <span className="text-[10px] text-emerald-600 uppercase font-bold block">Resolved</span>
                  <span className="text-lg font-extrabold text-emerald-700">{stats.resolved_items}</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="glass-panel p-4 border-slate-200 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by title, brand, color, location or keywords..."
                    value={browseSearch}
                    onChange={(e) => setBrowseSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                  />
                  {browseSearch && (
                    <button 
                      onClick={() => setBrowseSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Classification Toggle: All / Lost / Found */}
                <div className="p-1 rounded-xl bg-slate-100 border border-slate-200 flex text-xs font-semibold w-full md:w-auto">
                  {['ALL', 'LOST', 'FOUND'].map(t => (
                    <button
                      key={t}
                      onClick={() => setBrowseType(t)}
                      className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition ${
                        browseType === t ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t === 'ALL' ? 'All Items' : t}
                    </button>
                  ))}
                </div>

                {/* Category Dropdown */}
                <select
                  value={browseCategory}
                  onChange={(e) => setBrowseCategory(e.target.value)}
                  className="w-full md:w-auto px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="ID Cards">ID Cards & Wallets</option>
                  <option value="Books">Books & Academic</option>
                  <option value="Audio">Audio Gadgets</option>
                  <option value="Personal">Personal Items</option>
                  <option value="Keys">Keys</option>
                  <option value="Clothing">Clothing & Bags</option>
                </select>

                {/* View Mode Toggle: Grid vs List */}
                <div className="hidden sm:flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={fetchItems}
                  className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 transition shadow-sm"
                  title="Refresh items"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Category Tag Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Quick:
                </span>
                {['ALL', 'Electronics', 'ID Cards', 'Books', 'Audio', 'Personal', 'Keys', 'Clothing'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setBrowseCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      browseCategory === cat
                        ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty States */}
            {items.length === 0 ? (
              <div className="glass-panel p-12 text-center border-dashed border-slate-200 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No Articles Reported Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  The campus lost and found directory is currently empty. As users file real-time lost and found reports, they will be indexed and displayed here.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setActiveTab('report')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    File First Report
                  </button>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="glass-panel p-12 text-center border-dashed border-slate-200 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No Matching Articles Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No records match your selected query and category filters. Try clearing filters.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => { setBrowseSearch(''); setBrowseCategory('ALL'); setBrowseType('ALL'); }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : null}

            {/* Grid View */}
            {viewMode === 'grid' && filteredItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredItems.map(item => {
                  const isLost = item.type === 'LOST';
                  return (
                    <div 
                      key={item.id}
                      className="glass-card overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Preview Container */}
                        <div className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                          {item.image_url && !imgFailed[item.id] ? (
                            <img 
                              src={getImageUrl(item.image_url)} 
                              alt={item.title} 
                              className="w-full h-full object-cover transition duration-300 hover:scale-105" 
                              onError={() => setImgFailed(prev => ({ ...prev, [item.id]: true }))}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/50 text-slate-400">
                              <Camera className="w-8 h-8 mb-1 text-slate-300" />
                              <span className="text-[11px] font-medium text-slate-400">
                                {item.image_url ? 'Photo Expired' : 'No Photo Uploaded'}
                              </span>
                            </div>
                          )}

                          {/* Classification Pill */}
                          <div className="absolute top-3 left-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                              isLost 
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                                : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                            }`}>
                              {item.type}
                            </span>
                          </div>

                          {/* Status Pill & Role-Based Actions */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {item.approval_status === 'APPROVED' && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                                <BadgeCheck className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === 'RESOLVED' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                              item.status === 'CLAIM_PENDING' 
                                ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                'bg-white/90 text-slate-700 border-slate-200'
                            } shadow-sm backdrop-blur-md`}>
                              {item.status}
                            </span>
                            {authUser?.role === 'admin' && (
                              <button
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="p-1 rounded-full bg-white/90 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 shadow-sm transition"
                                title="Admin: Delete article report"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {item.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {item.date_lost_or_found}
                            </span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 font-['Outfit']" title={item.title}>
                            {item.title}
                          </h3>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Attribute Pills */}
                          <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-600" />
                              <span className="truncate max-w-[130px]">{item.location}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                              Color: <strong className="text-slate-800">{item.color}</strong>
                            </span>
                            {item.brand && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 font-semibold text-slate-700">
                                {item.brand}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Role-Based User vs Admin Actions */}
                      <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                        <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                          Reported by: <span className="font-medium text-slate-700">{item.reporter_name || 'Anonymous'}</span>
                        </span>

                        {authUser?.role === 'admin' ? (
                          /* Admin Actions for Approving and Resolving Items */
                          <div className="flex items-center gap-1.5">
                            {item.approval_status !== 'APPROVED' && (
                              <button
                                onClick={() => handleApproveItem(item.id, 'APPROVED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1"
                                title="Admin: Approve item"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}
                            {item.status !== 'RESOLVED' && (
                              <button
                                onClick={() => handleApproveItem(item.id, 'APPROVED', 'RESOLVED')}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] transition"
                                title="Admin: Mark resolved"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Regular User Actions */
                          item.type === 'FOUND' && item.status !== 'RESOLVED' && (
                            <button
                              onClick={() => setClaimModalData({ item, match: null })}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                            >
                              Claim Ownership
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && filteredItems.length > 0 && (
              <div className="glass-panel overflow-hidden border-slate-200">
                <div className="divide-y divide-slate-100">
                  {filteredItems.map(item => {
                    const isLost = item.type === 'LOST';
                    return (
                      <div key={item.id} className="p-4 hover:bg-blue-50/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            {item.image_url && !imgFailed[item.id] ? (
                              <img 
                                src={getImageUrl(item.image_url)} 
                                alt={item.title} 
                                className="w-full h-full object-cover" 
                                onError={() => setImgFailed(prev => ({ ...prev, [item.id]: true }))}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Camera className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isLost ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {item.type}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700">
                                {item.category}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {item.date_lost_or_found}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                            
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-600" /> {item.location}</span>
                              <span>Color: <strong className="text-slate-700">{item.color}</strong></span>
                              {item.brand && <span>Brand: <strong className="text-slate-700">{item.brand}</strong></span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                          {item.approval_status === 'APPROVED' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-300">
                              ✓ VERIFIED
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            item.status === 'CLAIM_PENDING' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {item.status}
                          </span>

                          {authUser?.role === 'admin' ? (
                            <div className="flex items-center gap-1.5">
                              {item.approval_status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleApproveItem(item.id, 'APPROVED')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {item.status !== 'RESOLVED' && (
                                <button
                                  onClick={() => handleApproveItem(item.id, 'APPROVED', 'RESOLVED')}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs transition"
                                >
                                  Resolve
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                                title="Admin: Delete report"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            item.type === 'FOUND' && item.status !== 'RESOLVED' && (
                              <button
                                onClick={() => setClaimModalData({ item, match: null })}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                              >
                                Claim
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PAGE 2: AI MATCH RADAR (Neural Multi-Modal Matching Engine)   */}
        {/* ============================================================== */}
        {activeTab === 'radar' && (
          <div className="space-y-6 animate-fade-in">
            {/* Visual Hero Showcase Banner */}
            <div className="glass-panel p-6 lg:p-8 border-blue-200/90 relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/70">
              {/* Subtle background radar decorative graphic */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-72 h-72 pointer-events-none opacity-20 hidden md:block">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-blue-400" />
                  <div className="absolute inset-8 rounded-full border border-blue-300" />
                  <div className="absolute inset-16 rounded-full border border-blue-200" />
                  <div className="absolute inset-24 rounded-full border border-blue-100" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-blue-600 radar-sweep-beam" />
                </div>
              </div>

              <div className="relative z-10 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Multi-Modal Neural Matching
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                    ● 384D Embeddings Active
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
                  AI Match Radar & Similarity Matrix
                </h1>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Autonomous cross-matching engine evaluating Lost vs Found articles using Sentence-Transformers 
                  vector cosine similarity, computer vision feature extractors, attribute ontologies, campus GIS zones, 
                  and temporal decay proximity.
                </p>

                {/* Radar Interactive Cutoff Control */}
                <div className="mt-5 p-4 rounded-xl bg-white border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-xl">
                  <div>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" /> Confidence Filter Cutoff: <span className="text-blue-700 font-extrabold">{radarThreshold}%</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Filter candidate pairs by calculated multi-modal confidence</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="40"
                      max="90"
                      step="5"
                      value={radarThreshold}
                      onChange={(e) => setRadarThreshold(Number(e.target.value))}
                      className="w-36 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      ≥{radarThreshold}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Radar Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-panel p-4 border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total AI Matches</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900 font-['Outfit']">{matches.length}</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Indexed</span>
                </div>
              </div>

              <div className="glass-panel p-4 border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">High Confidence</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-700 font-['Outfit']">{stats.high_confidence_matches}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">≥80% Match</span>
                </div>
              </div>

              <div className="glass-panel p-4 border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Claims</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-amber-700 font-['Outfit']">{stats.pending_claims}</span>
                  <span className="text-[11px] text-amber-600 font-semibold">In Review</span>
                </div>
              </div>

              <div className="glass-panel p-4 border-slate-200 bg-white">
                <span className="text-[10px] uppercase font-bold text-blue-600 block">Auto-Resolved</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-blue-700 font-['Outfit']">{stats.resolved_items}</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Recovered</span>
                </div>
              </div>
            </div>

            {/* Matches List Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-lg text-slate-900 font-['Outfit'] flex items-center gap-2">
                <Radar className="w-4 h-4 text-blue-600" />
                Detected Match Pairs ({filteredMatches.length})
              </h2>
              <button
                onClick={fetchMatches}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Re-scan Matrix
              </button>
            </div>

            {/* Match Cards List */}
            {matches.length === 0 ? (
              <div className="glass-panel p-12 text-center border-dashed border-slate-200 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                  <Radar className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No Matching Pairs Detected Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  The multi-modal AI engine runs in real time. Once users file both lost and found reports, candidates will be evaluated and displayed on this radar.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('report')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    File an Item Report
                  </button>
                  <button
                    onClick={fetchMatches}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Refresh Radar
                  </button>
                </div>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="glass-panel p-12 text-center border-dashed border-slate-200 bg-white">
                <Radar className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="font-bold text-slate-700 text-sm">No matches found above {radarThreshold}% threshold</h3>
                <p className="text-xs text-slate-500 mt-1">Lower the threshold slider above or file new lost and found articles.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map(match => {
                  const lost = match.lost_item || {};
                  const found = match.found_item || {};

                  return (
                    <div 
                      key={match.id}
                      className="glass-card p-5 lg:p-6 hover:border-blue-300 transition-all bg-white"
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                        {/* Circular Score Gauge & Status */}
                        <div className="flex items-center gap-4">
                          <CircularGauge score={match.total_score} size={84} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                match.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                                match.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-300' :
                                match.total_score >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                                'bg-blue-50 text-blue-700 border border-blue-300'
                              }`}>
                                {match.status === 'PENDING' ? (match.total_score >= 80 ? 'HIGH CONFIDENCE' : 'POTENTIAL CANDIDATE') : match.status}
                              </span>
                              <span className="text-[10px] text-slate-400">Match ID #{match.id}</span>
                            </div>

                            <p className="text-xs font-bold text-slate-800 mt-1 font-['Outfit']">
                              Multi-Modal Correlation: {match.total_score}%
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Gate evaluation: Cosine text vector passed threshold
                            </p>
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setSelectedMatch(match)}
                            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Neural Matrix</span>
                          </button>

                          {found.status !== 'RESOLVED' && (
                            <button
                              onClick={() => setClaimModalData({ item: found, match })}
                              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify Ownership Claim</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Side by Side Lost vs Found Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100">
                        {/* Lost Item Summary */}
                        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 flex items-start gap-3">
                          <div className="w-14 h-14 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-rose-200">
                            {lost.image_url && !imgFailed[`lost_${match.id}`] ? (
                              <img 
                                src={getImageUrl(lost.image_url)} 
                                alt={lost.title} 
                                className="w-full h-full object-cover" 
                                onError={() => setImgFailed(prev => ({ ...prev, [`lost_${match.id}`]: true }))}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-rose-300">
                                <Camera className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-rose-700 uppercase">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              LOST ARTICLE
                              <span className="text-slate-400 font-normal ml-auto">{lost.category}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">{lost.title}</h4>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">"{lost.description}"</p>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-rose-500" /> {lost.location}
                            </p>
                          </div>
                        </div>

                        {/* Found Item Summary */}
                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                          <div className="w-14 h-14 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-blue-200">
                            {found.image_url && !imgFailed[`found_${match.id}`] ? (
                              <img 
                                src={getImageUrl(found.image_url)} 
                                alt={found.title} 
                                className="w-full h-full object-cover" 
                                onError={() => setImgFailed(prev => ({ ...prev, [`found_${match.id}`]: true }))}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-blue-300">
                                <Camera className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-700 uppercase">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              FOUND ARTICLE
                              <span className="text-slate-400 font-normal ml-auto">{found.category}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">{found.title}</h4>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">"{found.description}"</p>
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-blue-500" /> {found.location}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 5-Dimensional Metric Preview Strip */}
                      {match.sub_scores && (
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 block font-semibold">NLP Text (35%)</span>
                            <span className="text-xs font-bold text-blue-700">{match.sub_scores.semantic_desc}%</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 block font-semibold">Visual CV (30%)</span>
                            <span className="text-xs font-bold text-cyan-700">
                              {match.sub_scores.visual !== null ? `${match.sub_scores.visual}%` : 'Reallocated'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 block font-semibold">Color & Brand (15%)</span>
                            <span className="text-xs font-bold text-purple-700">{match.sub_scores.attribute}%</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 block font-semibold">Location GIS (10%)</span>
                            <span className="text-xs font-bold text-emerald-700">{match.sub_scores.location}%</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-[10px] text-slate-500 block font-semibold">Temporal (10%)</span>
                            <span className="text-xs font-bold text-amber-700">{match.sub_scores.temporal}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PAGE 3: CATEGORIES & CRITERIA (Dedicated Page requested)       */}
        {/* ============================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Hero Banner for Categories */}
            <div className="glass-panel p-6 lg:p-8 border-blue-200/90 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Campus Taxonomy & Verification Rules</span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 font-['Outfit']">
                  Item Categories & Verification Criteria
                </h1>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Standardized campus lost and found classification criteria. Our multi-modal AI engine applies 
                  category-specific attribute weighting and verification standards to safeguard property and prevent false claims.
                </p>
              </div>

              {/* Taxonomy Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-blue-100">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Classified Domains</span>
                  <span className="text-xl font-extrabold text-slate-900">{TAXONOMY_CATEGORIES.length} Categories</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Attribute Ontology</span>
                  <span className="text-xl font-extrabold text-blue-700">100% Indexed</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Security Supervised</span>
                  <span className="text-xl font-extrabold text-emerald-700">Strict Gate</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg Resolution Time</span>
                  <span className="text-xl font-extrabold text-purple-700">24-48 Hours</span>
                </div>
              </div>
            </div>

            {/* Comprehensive Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {TAXONOMY_CATEGORIES.map(category => {
                // Compute live stats for this category from database items
                const categoryItems = items.filter(i => i.category.toLowerCase().includes(category.id.toLowerCase()));
                const lostCount = categoryItems.filter(i => i.type === 'LOST').length;
                const foundCount = categoryItems.filter(i => i.type === 'FOUND').length;

                return (
                  <div 
                    key={category.id}
                    className="glass-card p-5 lg:p-6 flex flex-col justify-between hover:border-blue-300 transition-all bg-white"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shadow-sm">
                          {category.icon}
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {category.badge}
                        </span>
                      </div>

                      {/* Category Name & Description */}
                      <h3 className="font-extrabold text-slate-900 text-lg mt-3 font-['Outfit']">
                        {category.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {category.description}
                      </p>

                      {/* Live Counter Badges */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {lostCount} Lost Articles
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {foundCount} Found Articles
                        </span>
                      </div>

                      {/* Criteria Checklist */}
                      <div className="mt-4 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                          Mandatory Verification Criteria:
                        </span>
                        {category.primaryCriteria.map((crit, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">{crit}</span>
                          </div>
                        ))}
                      </div>

                      {/* Proof Rule Box */}
                      <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                        <strong className="text-slate-800 font-semibold block mb-0.5">Required Proof of Ownership:</strong>
                        {category.verificationProof}
                      </div>
                    </div>

                    {/* Bottom Action Shortcuts */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setBrowseCategory(category.id);
                          setActiveTab('explore');
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200 hover:border-blue-200"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Filter in Directory</span>
                      </button>

                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, category: category.id }));
                          setActiveTab('report');
                        }}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                        title={`Report an item under ${category.name}`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Criteria & Multi-Modal Weighting Guide Table */}
            <div className="glass-panel p-6 border-slate-200 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900 font-['Outfit']">
                  Multi-Modal Neural Weight Distribution by Category
                </h3>
              </div>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                How our automated matching engine adjusts scoring vector formulas based on domain criteria:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                      <th className="p-3">Category Domain</th>
                      <th className="p-3">Primary Identifier</th>
                      <th className="p-3">Vision (CV) Weight</th>
                      <th className="p-3">Semantic NLP Weight</th>
                      <th className="p-3">Attribute Gate</th>
                      <th className="p-3">Security Release Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-blue-50/30">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">💻 Electronics</td>
                      <td className="p-3">Serial / IMEI / Lock Screen</td>
                      <td className="p-3 font-semibold text-blue-600">30% (Color & Ports)</td>
                      <td className="p-3 font-semibold text-indigo-600">35% (Model & Specs)</td>
                      <td className="p-3 font-mono text-[11px]">Brand + Color Match</td>
                      <td className="p-3 text-emerald-700 font-medium">PIN Unlock / Receipt</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">🪪 ID Cards & Wallets</td>
                      <td className="p-3">Student Name & Roll No.</td>
                      <td className="p-3 font-semibold text-slate-500">15% (Wallet pattern)</td>
                      <td className="p-3 font-semibold text-indigo-600">50% (Exact Name NLP)</td>
                      <td className="p-3 font-mono text-[11px]">ERP Database Match</td>
                      <td className="p-3 text-emerald-700 font-medium">Active Portal Verification</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">📚 Books & Academic</td>
                      <td className="p-3">Title & Inscribed Signatures</td>
                      <td className="p-3 font-semibold text-slate-500">20% (Cover match)</td>
                      <td className="p-3 font-semibold text-indigo-600">45% (Title & Author)</td>
                      <td className="p-3 font-mono text-[11px]">Edition + Subject</td>
                      <td className="p-3 text-emerald-700 font-medium">Handwritten Inscription</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">🎧 Audio Gadgets</td>
                      <td className="p-3">Bluetooth Name & Serial</td>
                      <td className="p-3 font-semibold text-blue-600">35% (Case & Scratches)</td>
                      <td className="p-3 font-semibold text-indigo-600">30% (Model spec)</td>
                      <td className="p-3 font-mono text-[11px]">Brand + Case Tone</td>
                      <td className="p-3 text-emerald-700 font-medium">Live Bluetooth Connect</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">🧴 Personal Items</td>
                      <td className="p-3">Brand, Stickers & Scratches</td>
                      <td className="p-3 font-semibold text-blue-600">40% (Visual CV)</td>
                      <td className="p-3 font-semibold text-indigo-600">25% (Description)</td>
                      <td className="p-3 font-mono text-[11px]">Color Spectrum</td>
                      <td className="p-3 text-emerald-700 font-medium">Sticker/Scratch details</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">🔑 Keys & Access</td>
                      <td className="p-3">Key Count & Keychain Mascot</td>
                      <td className="p-3 font-semibold text-blue-600">45% (Visual Key Count)</td>
                      <td className="p-3 font-semibold text-indigo-600">20% (Fob description)</td>
                      <td className="p-3 font-mono text-[11px]">Key Number Count</td>
                      <td className="p-3 text-emerald-700 font-medium">Physical Lock Test</td>
                    </tr>
                    <tr className="hover:bg-blue-50/30">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">🎒 Clothing & Bags</td>
                      <td className="p-3">Brand, Zippers & Contents</td>
                      <td className="p-3 font-semibold text-blue-600">35% (Color & Texture)</td>
                      <td className="p-3 font-semibold text-indigo-600">30% (Pocket list)</td>
                      <td className="p-3 font-mono text-[11px]">Brand + Size tag</td>
                      <td className="p-3 text-emerald-700 font-medium">Pocket Contents List</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PAGE 4: REPORT AN ITEM (Dedicated Filing Page)                */}
        {/* ============================================================== */}
        {activeTab === 'report' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="glass-panel p-6 sm:p-8 border-blue-200/90 bg-white">
              <div className="mb-6">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> High-Resolution Multi-Modal Report Wizard
                </span>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 font-['Outfit'] mt-1">
                  File a Lost or Recovered Article
                </h1>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Provide descriptive attributes and clear images. Our AI engine computes 384-dimensional text vectors and visual features to autonomously match candidates across campus.
                </p>

                {/* Live AI Description Readiness Bar */}
                <div className="mt-4 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-700 font-semibold">AI Match Readiness Index:</span>
                    <strong className={descScore >= 80 ? 'text-emerald-700' : 'text-blue-700'}>
                      {descScore}% ({descScore >= 80 ? 'Optimal for Neural Embeddings' : 'Add more details/photo for higher accuracy'})
                    </strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        descScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-blue-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                      }`}
                      style={{ width: `${descScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-5">
                {/* Step 1: Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Classification *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'LOST' })}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        formData.type === 'LOST'
                          ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      I LOST AN ITEM
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'FOUND' })}
                      className={`p-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        formData.type === 'FOUND'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      I FOUND AN ITEM
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell XPS 13 Ultrabook with blue sleeve, or Fossil Brown Leather Wallet"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                  />
                </div>

                {/* Category & Brand */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Domain Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                    >
                      <option value="Electronics">Electronics (Laptops, Phones, Gadgets)</option>
                      <option value="ID Cards & Wallets">ID Cards & Wallets</option>
                      <option value="Books & Academic">Books & Academic Notes</option>
                      <option value="Audio & Gadgets">Audio & Headphones</option>
                      <option value="Personal Items">Personal Items (Bottles, Glasses, etc.)</option>
                      <option value="Keys">Keys & Security Fobs</option>
                      <option value="Clothing & Bags">Clothing & Backpacks</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Brand / Make</label>
                    <input
                      type="text"
                      placeholder="e.g. Dell, Sony, Apple, Fossil, Nike, Hydro Flask"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                    />
                  </div>
                </div>

                {/* Color Chips Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Primary Color * (Current: <strong className="text-blue-700">{formData.color}</strong>)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { name: 'Black', hex: '#000000' },
                      { name: 'Midnight Blue', hex: '#1e3a8a' },
                      { name: 'Brown', hex: '#78350f' },
                      { name: 'Olive Green', hex: '#3f6212' },
                      { name: 'Yellow', hex: '#eab308' },
                      { name: 'Grey', hex: '#64748b' },
                      { name: 'Red', hex: '#dc2626' },
                      { name: 'White', hex: '#ffffff' }
                    ].map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.name })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition ${
                          formData.color === c.name 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Or type custom color shade..."
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  />
                </div>

                {/* Campus Location & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Campus Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Library 2nd Floor Silent Study Area, or Block B Lab 3"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Date of Incident *</label>
                    <input
                      type="date"
                      required
                      value={formData.date_lost_or_found}
                      onChange={(e) => setFormData({ ...formData, date_lost_or_found: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                    />
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">Detailed Description *</label>
                    <span className="text-[11px] text-slate-400">
                      Sentence-Transformers vectorizes this text for semantic matching
                    </span>
                  </div>
                  <textarea
                    required
                    rows="4"
                    placeholder="Mention specific stickers, scratches, lock screen message, brand logo, markings, contents inside pockets, or distinctive identifying features..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Visual Evidence / Photo (Highly Recommended for Computer Vision Scoring)
                  </label>
                  <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-6 text-center transition bg-slate-50/50 hover:bg-blue-50/30">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {imagePreview ? (
                      <div className="flex items-center justify-center gap-4">
                        <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-md" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Ready for Vision Feature Extraction
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Click or drag a new image to replace</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Upload className="w-7 h-7 text-blue-600 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">
                          Drop photo here or <span className="text-blue-600 underline">browse device</span>
                        </p>
                        <p className="text-[11px] text-slate-400">Supports JPEG, PNG, WEBP (Visual weight automatically reallocated if omitted)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Reporter Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Student / Staff Name"
                      value={formData.reporter_name}
                      onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email / Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. student@campus.edu or 9876543210"
                      value={formData.reporter_contact}
                      onChange={(e) => setFormData({ ...formData, reporter_contact: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 shimmer-btn"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Computing Multi-Modal Vector Embeddings...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit Report & Trigger Multi-Modal AI Engine</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        /* ============================================================== */
        {/* PAGE 5: ADMIN DESK (Claims Verification & Item Approvals)     */}
        {/* ============================================================== */}
        {activeTab === 'admin' && (
          (!authUser || authUser.role !== 'admin') ? (
            /* Restricted Access Gate for Non-Admins */
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-10">
              <div className="glass-panel p-8 text-center border-amber-200/90 bg-white/95 shadow-2xl relative overflow-hidden rounded-3xl">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500" />
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Campus Security Desk Clearance Required
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] mt-3">
                  Admin Authorization Required
                </h2>
                <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  {authUser 
                    ? `You are currently signed in as a Campus Student (${authUser.email}). Reviewing ownership proofs, approving reported articles, and authorizing item releases is strictly restricted to Campus Security Administrators.`
                    : 'The Administrative Desk is restricted to authorized campus security personnel. Please sign in with Security Administrator credentials to evaluate claims, approve items, and authorize article releases.'
                  }
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setAuthPortalRole('admin');
                      setActiveTab('login');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Go to Security Admin Login</span>
                  </button>

                  <button
                    onClick={() => handleQuickDemoLogin('admin')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>⚡ 1-Click Demo Admin Login</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('explore')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Back to Directory
                  </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                  <p>Demo Admin Credentials: <strong className="text-slate-800 font-mono">admin@campus.edu</strong> / <strong className="text-slate-800 font-mono">admin123</strong></p>
                </div>
              </div>
            </div>
          ) : (
            /* Authorized Security Administrator Workspace */
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel p-6 border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Campus Security Administration & Audit • Logged in as {authUser.full_name || authUser.email}</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] mt-1">
                    Item Approvals & Claims Verification Desk
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Evaluate real-time ownership proof, approve or reject reported articles, authorize item releases, and audit incident records.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setCustomApiInput(apiBaseUrl || 'https://findrai-zfnm.onrender.com');
                      setApiModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-2 transition"
                    title="Configure backend API URL"
                  >
                    <Server className="w-4 h-4 text-blue-600" />
                    <span>Backend Settings</span>
                  </button>
                  <button
                    onClick={handleRecalculate}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-2 transition shadow-sm"
                    title="Re-run neural vector matching on all reported articles"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Recalculate Matches</span>
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 transition"
                    title="Purge all database records"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear All Records</span>
                  </button>
                </div>
              </div>

              {/* Subtabs */}
              <div className="flex items-center gap-4 border-b border-slate-200 pb-3 overflow-x-auto">
                <button
                  onClick={() => setAdminTab('claims')}
                  className={`text-xs font-bold pb-1 transition flex items-center gap-2 flex-shrink-0 ${
                    adminTab === 'claims'
                      ? 'text-amber-700 border-b-2 border-amber-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Ownership Claims Queue</span>
                  {claims.filter(c => c.status === 'PENDING').length > 0 && (
                    <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {claims.filter(c => c.status === 'PENDING').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setAdminTab('approvals')}
                  className={`text-xs font-bold pb-1 transition flex items-center gap-2 flex-shrink-0 ${
                    adminTab === 'approvals'
                      ? 'text-amber-700 border-b-2 border-amber-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BadgeCheck className="w-4 h-4" />
                  <span>Item Approvals Desk</span>
                  <span className="text-slate-400 text-[10px]">({items.length})</span>
                </button>

                <button
                  onClick={() => setAdminTab('reports')}
                  className={`text-xs font-bold pb-1 transition flex items-center gap-2 flex-shrink-0 ${
                    adminTab === 'reports'
                      ? 'text-amber-700 border-b-2 border-amber-600 font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Security Incident Logs</span>
                </button>
              </div>

              {/* Subtab 1: Claims Queue */}
              {adminTab === 'claims' && (
                <div className="space-y-4">
                  {claims.length === 0 ? (
                    <div className="glass-panel p-12 text-center border-dashed border-slate-200 bg-white">
                      <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <h3 className="font-bold text-slate-800 text-sm">No Ownership Claims Filed</h3>
                      <p className="text-xs text-slate-500 mt-1">When students claim found articles, their verification proof and contact info will appear here for authorization.</p>
                    </div>
                  ) : (
                    claims.map(claim => {
                      const item = claim.item || {};
                      return (
                        <div 
                          key={claim.id}
                          className="glass-panel p-5 border-slate-200 bg-white flex flex-col md:flex-row items-start justify-between gap-5"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                claim.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-300' :
                                claim.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                                'bg-rose-50 text-rose-700 border border-rose-300'
                              }`}>
                                CLAIM {claim.status}
                              </span>
                              <span className="text-[11px] text-slate-400">Claim ID #{claim.id}</span>
                            </div>

                            <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                              Claim for: {item.title || `Item #${claim.item_id}`}
                            </h3>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                              <strong className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                                Submitted Proof Description:
                              </strong>
                              "{claim.proof_description}"
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span>Claimant: <strong className="text-slate-800">{claim.claimant_name}</strong></span>
                              <span>Contact: <strong className="text-slate-800">{claim.claimant_contact}</strong></span>
                              <span>Date: {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'Recent'}</span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          {claim.status === 'PENDING' && (
                            <div className="flex items-center gap-2 self-end md:self-center">
                              <button
                                onClick={() => handleReviewClaim(claim.id, 'APPROVED')}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                              >
                                <Check className="w-4 h-4" />
                                <span>Authorize Release</span>
                              </button>
                              <button
                                onClick={() => handleReviewClaim(claim.id, 'REJECTED')}
                                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
                              >
                                <X className="w-4 h-4" />
                                <span>Reject Claim</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Subtab 2: Item Approvals Desk */}
              {adminTab === 'approvals' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Security Item Approval & Verification Desk</h4>
                      <p className="text-slate-600 mt-0.5">
                        Administrators can directly approve community reports as officially verified campus items, resolve completed cases, or purge fraudulent submissions.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => {
                      const isApproved = item.approval_status === 'APPROVED';
                      return (
                        <div key={item.id} className="glass-panel p-4 border-slate-200 bg-white flex flex-col justify-between space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                              {item.image_url && !imgFailed[item.id] ? (
                                <img 
                                  src={getImageUrl(item.image_url)} 
                                  alt={item.title} 
                                  className="w-full h-full object-cover" 
                                  onError={() => setImgFailed(prev => ({ ...prev, [item.id]: true }))}
                                />
                              ) : (
                                <Camera className="w-6 h-6 text-slate-300" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.type === 'LOST' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {item.type}
                                </span>
                                <span className="text-slate-400 text-[10px] font-mono">#{item.id}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isApproved 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}>
                                  {isApproved ? '✓ VERIFIED BY ADMIN' : '⏳ PENDING REVIEW'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  item.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                  item.status === 'CLAIM_PENDING' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">{item.title}</h4>
                              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                <span>📍 {item.location}</span>
                                <span>📅 {item.date_lost_or_found}</span>
                              </p>
                            </div>
                          </div>

                          {/* Admin Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              By: <strong>{item.reporter_name || 'Anonymous'}</strong> ({item.reporter_contact})
                            </span>

                            <div className="flex items-center gap-1.5">
                              {!isApproved && (
                                <button
                                  onClick={() => handleApproveItem(item.id, 'APPROVED')}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                                  title="Approve and mark as officially verified article"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve Item</span>
                                </button>
                              )}

                              {item.status !== 'RESOLVED' && (
                                <button
                                  onClick={() => handleApproveItem(item.id, 'APPROVED', 'RESOLVED')}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-bold transition flex items-center gap-1"
                                  title="Mark item as resolved and returned"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>Mark Resolved</span>
                                </button>
                              )}

                              <button
                                onClick={(e) => handleDeleteItem(item.id, e)}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
                                title="Delete false or duplicate report"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subtab 3: Incident Logs Table */}
              {adminTab === 'reports' && (
                <div className="glass-panel overflow-hidden border-slate-200 bg-white">
                  {items.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-xs text-slate-500">No incident logs recorded yet. All user reports will be tracked here in real time.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="p-3.5">ID</th>
                            <th className="p-3.5">Type</th>
                            <th className="p-3.5">Title</th>
                            <th className="p-3.5">Category</th>
                            <th className="p-3.5">Location</th>
                            <th className="p-3.5">Date</th>
                            <th className="p-3.5">Verification</th>
                            <th className="p-3.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {items.map(item => (
                            <tr key={item.id} className="hover:bg-blue-50/40">
                              <td className="p-3.5 font-mono text-slate-400">#{item.id}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.type === 'LOST' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="p-3.5 font-semibold text-slate-900">{item.title}</td>
                              <td className="p-3.5 text-slate-600">{item.category}</td>
                              <td className="p-3.5 text-slate-600">{item.location}</td>
                              <td className="p-3.5 text-slate-500">{item.date_lost_or_found}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                                }`}>
                                  {item.approval_status === 'APPROVED' ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  item.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                  item.status === 'CLAIM_PENDING' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                  'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
          </>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: NEURAL MATRIX INSPECTION & WEIGHT SIMULATION         */}
      {/* ============================================================== */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 lg:p-8 max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Neural Correlation Breakdown
                  </span>
                  <span className="text-xs text-slate-400">Match #{selectedMatch.id}</span>
                </div>
                <h3 className="font-extrabold text-xl text-slate-900 font-['Outfit'] mt-1">
                  5-Dimensional Multi-Modal Analysis
                </h3>
              </div>

              <button 
                onClick={() => setSelectedMatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Showcase */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/70 border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CircularGauge score={selectedMatch.total_score} size={76} />
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">
                    Composite Multi-Modal Score
                  </span>
                  <h4 className="text-2xl font-extrabold text-slate-900 font-['Outfit']">
                    {selectedMatch.total_score}% Confidence
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Category Gate Passed • High-Dimensional Cosine Proximity
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMatchStatus(selectedMatch.id, 'CONFIRMED')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm</span>
                </button>
                <button
                  onClick={() => handleMatchStatus(selectedMatch.id, 'REJECTED')}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {/* Mathematical Formula Card */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 mb-6 font-mono text-xs">
              <span className="text-[10px] text-blue-700 uppercase tracking-wider font-bold block mb-1">
                Core Scoring Formulation:
              </span>
              <div className="text-slate-800 text-xs sm:text-sm font-semibold">
                Total Score = (w₁ · S_desc + w₂ · S_img + w₃ · S_attr + w₄ · S_loc + w₅ · S_time) × 100
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Weights dynamically redistributed if either report lacks an uploaded image (w₂ vision weight reallocated to text & attributes).
              </div>
            </div>

            {/* 5-Dimensional Metrics */}
            {selectedMatch.sub_scores && (
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Itemized Dimensional Analysis
                </h4>

                <div className="space-y-3">
                  {/* S_desc */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-800 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        1. Semantic Description Match (S_desc)
                      </span>
                      <strong className="text-blue-700 font-bold">
                        {selectedMatch.sub_scores.semantic_desc}% (Weight: {Math.round(selectedMatch.sub_scores.weights_used?.w_desc * 100)}%)
                      </strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${selectedMatch.sub_scores.semantic_desc}%` }}
                      />
                    </div>
                  </div>

                  {/* S_img */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-800 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-600" />
                        2. Visual Computer Vision Feature Match (S_img)
                      </span>
                      <strong className="text-cyan-700 font-bold">
                        {selectedMatch.sub_scores.visual !== null ? `${selectedMatch.sub_scores.visual}%` : 'Reallocated (No Photo)'} 
                        {selectedMatch.sub_scores.weights_used?.w_img > 0 && ` (Weight: ${Math.round(selectedMatch.sub_scores.weights_used.w_img * 100)}%)`}
                      </strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-cyan-600 rounded-full"
                        style={{ width: `${selectedMatch.sub_scores.visual || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* S_attr */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-800 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-600" />
                        3. Color & Brand Ontology Match (S_attr)
                      </span>
                      <strong className="text-purple-700 font-bold">
                        {selectedMatch.sub_scores.attribute}% (Weight: {Math.round(selectedMatch.sub_scores.weights_used?.w_attr * 100)}%)
                      </strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${selectedMatch.sub_scores.attribute}%` }}
                      />
                    </div>
                  </div>

                  {/* S_loc */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-800 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        4. Campus Zone & GIS Proximity (S_loc)
                      </span>
                      <strong className="text-emerald-700 font-bold">
                        {selectedMatch.sub_scores.location}% (Weight: {Math.round(selectedMatch.sub_scores.weights_used?.w_loc * 100)}%)
                      </strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${selectedMatch.sub_scores.location}%` }}
                      />
                    </div>
                  </div>

                  {/* S_time */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-800 font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        5. Exponential Temporal Proximity (S_time, τ = 14 days)
                      </span>
                      <strong className="text-amber-700 font-bold">
                        {selectedMatch.sub_scores.temporal}% (Weight: {Math.round(selectedMatch.sub_scores.weights_used?.w_time * 100)}%)
                      </strong>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${selectedMatch.sub_scores.temporal}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Explanations List */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Itemized Explanatory Factors:
                  </span>
                  {selectedMatch.sub_scores.explanations?.map((exp, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{exp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedMatch(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Close Analysis
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CLAIM OWNERSHIP & VERIFICATION SUBMISSION            */}
      {/* ============================================================== */}
      {claimModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  Campus Security Verification
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 font-['Outfit'] mt-0.5">
                  Claim Ownership for Article
                </h3>
              </div>
              <button 
                onClick={() => setClaimModalData(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
              <span className="text-slate-500 font-semibold block text-[10px] uppercase">Secured Found Item:</span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{claimModalData.item.title}</h4>
              <p className="text-slate-600 text-[11px] mt-0.5">Location: {claimModalData.item.location}</p>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Student / Claimant Name"
                  value={claimForm.claimant_name}
                  onChange={(e) => setClaimForm({ ...claimForm, claimant_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone / Student Email *</label>
                <input
                  type="text"
                  required
                  placeholder="student@campus.edu or 9876543210"
                  value={claimForm.claimant_contact}
                  onChange={(e) => setClaimForm({ ...claimForm, claimant_contact: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Private Proof of Ownership *
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Describe unannounced details only the true owner would know (e.g. lock screen password, unique stickers, internal pocket contents, scratches):
                </p>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. The laptop has a blue ACM sticker on the bottom left and the password begins with 'Arya...' or the wallet contains a yellow gym card."
                  value={claimForm.proof_description}
                  onChange={(e) => setClaimForm({ ...claimForm, proof_description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimModalData(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/25"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backend API Configuration Modal */}
      {apiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Connect Backend API</h3>
                  <p className="text-xs text-slate-500">Link your deployed FastAPI backend to this frontend</p>
                </div>
              </div>
              <button 
                onClick={() => setApiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  FastAPI Backend URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://your-backend.vercel.app"
                    value={customApiInput}
                    onChange={(e) => setCustomApiInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  />
                  <button
                    type="button"
                    disabled={apiTesting}
                    onClick={() => handleSaveApiUrl(customApiInput)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {apiTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Saved instantly in your browser storage. Works without redeploying.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-700">Quick Fill Presets:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomApiInput('https://findrai-zfnm.onrender.com')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 hover:border-blue-300 font-mono shadow-xs"
                  >
                    Use Deployed Vercel Backend
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomApiInput('http://127.0.0.1:8000')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 font-mono shadow-xs"
                  >
                    Localhost (127.0.0.1:8000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomApiInput('');
                      handleSaveApiUrl('');
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-slate-300 shadow-xs"
                  >
                    Reset (Relative /)
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 leading-relaxed bg-blue-50/70 p-3.5 rounded-xl border border-blue-100">
                <p className="font-bold text-blue-800 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Where to find Environment Variables on Vercel:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Go to <strong>vercel.com/dashboard</strong></li>
                  <li>Click on your <strong>findr-ai</strong> project (not your profile photo)</li>
                  <li>Click the <strong>Settings</strong> tab at the top bar</li>
                  <li>Click <strong>Environment Variables</strong> in the left sidebar</li>
                  <li>Add Key: <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-900 font-mono">VITE_API_BASE_URL</code> with your backend URL.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
