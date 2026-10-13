import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cancelOrder,
  createDemoUser,
  getOrderBook,
  getOrders,
  getPortfolio,
  getStocks,
  getUser,
  mapApiOrders,
  submitOrder,
  type ApiHolding,
  type ApiOrder,
  type ApiOrderBook,
  type ApiUser,
  type LocalOrder,
  type PublicTradeResponse,
} from "./api";
import { useTradeRefresh, useTradeStream } from "./useTradeStream";
import type { CSSProperties } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Command,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Terminal,
  Wallet,
  X,
} from "lucide-react";
import { WorldClocks } from "./components/WorldClocks";
import { InstrumentPickerModal, type StockItem } from "./components/InstrumentPickerModal";
import { PreferencesModal, type TerminalPreferences } from "./components/PreferencesModal";
import { ProfileMenu } from "./components/ProfileMenu";
import { MarketsView } from "./components/MarketsView";
import { ActivityView } from "./components/ActivityView";
import { IdentityPickerModal } from "./components/IdentityPickerModal";
import { IdentityIcon } from "./components/IdentityIcon";
import { NotFoundPage } from "./components/NotFoundPage";
import { assignRandomIdentityForUser, getStoredIdentity, saveStoredIdentity, type SignatureIdentity } from "./identities";
import { getRouteInfo, navigateTo } from "./router";
import { DEFAULT_CHART_POINTS, getChartPoints } from "./stockCharts";
import { ShadowCat } from "./components/ShadowCat";
import { getChartHistory, type ChartTimeframe, type ChartTimeframeData } from "./chartHistory";
import { getMarketPulseIndicators } from "./marketPulse";
import { PersonalityReactionBanner } from "./components/PersonalityReactionBanner";
import { createReaction, shouldShowReaction, type PersonalityEvent, type PersonalityReaction } from "./personality/personalitySystem";
import { NotificationsFlyout } from "./components/NotificationsFlyout";
import {
  loadUserNotifications,
  saveUserNotifications,
  createNotification,
  type UserNotification,
  hasOrderNotificationBeenSent,
  recordOrderNotificationSent,
  formatOrderFilledMessage,
  formatOrderPartiallyFilledMessage,
} from "./notifications/notificationStore";
import {
  loadUserWatchlist,
  toggleWatchlistSymbol,
  loadPersonalizedMarket,
  addStockToPersonalizedMarket,
  removeStockFromPersonalizedMarket,
  subscribeWatchlist,
} from "./watchlistStore";
import { YourMarketView } from "./components/YourMarketView";
import { CommandPaletteModal } from "./components/CommandPaletteModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { unlockAchievement } from "./achievements";
import { OrderCelebrationModal, type CelebrationOrderDetails } from "./components/OrderCelebrationModal";
import { ExtremeOrderPlacementModal, type PlacementOrderDetails } from "./components/ExtremeOrderPlacementModal";

type Stock = StockItem;

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function playTradeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

function Sparkline({ points, negative = false }: { points: number[]; negative?: boolean }) {
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${(index / (points.length - 1)) * 100} ${100 - point}`).join(" ");
  return (
    <svg className={`sparkline ${negative ? "is-negative" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MarketChart({
  chartHistory,
  symbol,
}: {
  chartHistory: ChartTimeframeData;
  symbol: string;
}) {
  const chartPoints = useMemo(() => {
    const base = chartHistory.points;
    return base.map((point, index) => ({
      x: 8 + (index / (base.length - 1)) * 884,
      y: 242 - point * 2.2,
    }));
  }, [chartHistory]);

  const linePath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L 892 246 L 8 246 Z`;
  const last = chartPoints[chartPoints.length - 1];

  return (
    <svg className="market-chart" viewBox="0 0 900 270" role="img" aria-label={`${symbol} ${chartHistory.timeframe} illustrative price chart`}>
      <g className="chart-grid">
        {[42, 92, 142, 192, 242].map((y) => <line key={y} x1="8" x2="892" y1={y} y2={y} />)}
        {[8, 185, 362, 539, 716, 892].map((x) => <line key={x} x1={x} x2={x} y1="18" y2="246" />)}
      </g>
      <path className="chart-area" d={areaPath} />
      <path className="chart-line" d={linePath} />
      <line className="chart-crosshair" x1={last.x} x2={last.x} y1="18" y2="246" />
      <circle className="chart-point-halo" cx={last.x} cy={last.y} r="7" />
      <circle className="chart-point" cx={last.x} cy={last.y} r="3.2" />
      <g className="chart-axis-labels">
        {chartHistory.xLabels.map((lbl, idx) => {
          const x = 8 + (idx / (chartHistory.xLabels.length - 1)) * 884;
          const anchor = idx === 0 ? "start" : idx === chartHistory.xLabels.length - 1 ? "end" : "middle";
          return (
            <text key={lbl} x={x} y="264" textAnchor={anchor}>
              {lbl}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

function App() {
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const [activeSection, setActiveSection] = useState("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState("");
  const [demoUserId, setDemoUserId] = useState<number | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("10");
  const [limitPrice, setLimitPrice] = useState("142.87");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [rawOrders, setRawOrders] = useState<ApiOrder[]>([]);
  const [portfolio, setPortfolio] = useState<ApiHolding[]>([]);
  const [account, setAccount] = useState<ApiUser | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [orderBook, setOrderBook] = useState<ApiOrderBook | null>(null);
  const [orderBookLoading, setOrderBookLoading] = useState(false);
  const [orderBookError, setOrderBookError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"BUY" | "SELL">("BUY");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [identityPickerOpen, setIdentityPickerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<ChartTimeframe>("1D");
  const [personalityReaction, setPersonalityReaction] = useState<PersonalityReaction | null>(null);
  const [watchedSymbols, setWatchedSymbols] = useState<string[]>(() => loadUserWatchlist(demoUserId));
  const [personalizedSymbols, setPersonalizedSymbols] = useState<string[]>(() => loadPersonalizedMarket(demoUserId));
  const [celebrationOrder, setCelebrationOrder] = useState<CelebrationOrderDetails | null>(null);
  const [placementOrder, setPlacementOrder] = useState<PlacementOrderDetails | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>(() => loadUserNotifications(demoUserId));

  // Identity state isolated per demo user
  const [identity, setIdentity] = useState<SignatureIdentity>(() => getStoredIdentity(demoUserId));

  useEffect(() => {
    setIdentity(getStoredIdentity(demoUserId));
    setNotifications(loadUserNotifications(demoUserId));
    setWatchedSymbols(loadUserWatchlist(demoUserId));
    setPersonalizedSymbols(loadPersonalizedMarket(demoUserId));

    // Subscribe to reactive watchlist updates for this demo user
    const unsubscribe = subscribeWatchlist(demoUserId, (symbols) => {
      setWatchedSymbols(symbols);
    });
    return unsubscribe;
  }, [demoUserId]);

  // Auto-dismiss ordinary bottom-right toasts after approximately 6 seconds with cleanup
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast("");
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSelectIdentity = (selected: SignatureIdentity) => {
    setIdentity(selected);
    saveStoredIdentity(selected.id, demoUserId);
    setToast(`Operator identity updated to ${selected.name}.`);
  };

  const [preferences, setPreferences] = useState<TerminalPreferences>(() => {
    try {
      const sound = window.localStorage.getItem("shadow_pref_sound") === "true";
      const density = (window.localStorage.getItem("shadow_pref_density") as "comfortable" | "compact") || "comfortable";
      const defaultQty = Number(window.localStorage.getItem("shadow_pref_default_qty")) || 10;
      const personalityMode = (window.localStorage.getItem("shadow_pref_personality") as any) || "full";
      const extremeCursorTrack = window.localStorage.getItem("shadow_pref_extreme_cursor") !== "false";
      const extremeAmbientAnim = window.localStorage.getItem("shadow_pref_extreme_ambient") !== "false";
      const extremeCelebrations = window.localStorage.getItem("shadow_pref_extreme_celebration") !== "false";
      const reduceMotion = window.localStorage.getItem("shadow_pref_reduce_motion") === "true";
      return {
        soundEnabled: sound,
        density,
        defaultQuantity: defaultQty,
        personalityMode,
        extremeCursorTrack,
        extremeAmbientAnim,
        extremeCelebrations,
        reduceMotion,
      };
    } catch {
      return { soundEnabled: false, density: "comfortable", defaultQuantity: 10, personalityMode: "full" };
    }
  });

  const handleUpdatePreferences = (updated: Partial<TerminalPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updated };
      try {
        if (updated.soundEnabled !== undefined) window.localStorage.setItem("shadow_pref_sound", String(next.soundEnabled));
        if (updated.density !== undefined) window.localStorage.setItem("shadow_pref_density", next.density);
        if (updated.defaultQuantity !== undefined) window.localStorage.setItem("shadow_pref_default_qty", String(next.defaultQuantity));
        if (updated.personalityMode !== undefined) window.localStorage.setItem("shadow_pref_personality", next.personalityMode);
        if (updated.extremeCursorTrack !== undefined) window.localStorage.setItem("shadow_pref_extreme_cursor", String(next.extremeCursorTrack));
        if (updated.extremeAmbientAnim !== undefined) window.localStorage.setItem("shadow_pref_extreme_ambient", String(next.extremeAmbientAnim));
        if (updated.extremeCelebrations !== undefined) window.localStorage.setItem("shadow_pref_extreme_celebration", String(next.extremeCelebrations));
        if (updated.reduceMotion !== undefined) window.localStorage.setItem("shadow_pref_reduce_motion", String(next.reduceMotion));
      } catch {}
      return next;
    });
  };

  const triggerCatReaction = useCallback(
    (event: PersonalityEvent, overrideMessage?: string, priorityOverride?: "high" | "medium" | "low") => {
      const reaction = createReaction(event, overrideMessage);
      if (priorityOverride) reaction.priority = priorityOverride;
      if (shouldShowReaction(reaction.priority, preferences.personalityMode)) {
        setPersonalityReaction(reaction);
      }
    },
    [preferences.personalityMode]
  );

  const pushNotification = useCallback(
    (params: {
      type: UserNotification["type"];
      title: string;
      message: string;
      expression: any;
      orderId?: number;
      symbol?: string;
      side?: "BUY" | "SELL";
      quantity?: number;
      price?: number;
      executedQuantity?: number;
    }) => {
      const notif = createNotification(params);
      setNotifications((prev) => {
        const next = [notif, ...prev];
        saveUserNotifications(next, demoUserId);
        return next;
      });
    },
    [demoUserId]
  );

  const handleToggleWatchSymbol = (symbol: string) => {
    const updated = toggleWatchlistSymbol(symbol, demoUserId);
    const isNowFavorited = updated.includes(symbol.toUpperCase());
    setWatchedSymbols(updated);
    triggerCatReaction(isNowFavorited ? "FAVORITE_ADDED" : "FAVORITE_REMOVED");
    setToast(isNowFavorited ? `Marked ${symbol} as favorite.` : `Removed ${symbol} from favorites.`);
  };

  const handleAddPersonalizedSymbol = (symbol: string) => {
    const updated = addStockToPersonalizedMarket(symbol, demoUserId);
    setPersonalizedSymbols(updated);
    setToast(`Added ${symbol} to your market view.`);
  };

  const handleRemovePersonalizedSymbol = (symbol: string) => {
    const updated = removeStockFromPersonalizedMarket(symbol, demoUserId);
    setPersonalizedSymbols(updated);
    setToast(`Removed ${symbol} from your market view.`);
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      saveUserNotifications(next, demoUserId);
      return next;
    });
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    saveUserNotifications([], demoUserId);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      saveUserNotifications(next, demoUserId);
      return next;
    });
  };

  const isMountedRef = useRef(true);
  const activeUserIdRef = useRef(demoUserId);
  activeUserIdRef.current = demoUserId;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Listen to browser forward/back buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Keyboard shortcut listener for Command Palette (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const routeInfo = useMemo(() => getRouteInfo(currentPath), [currentPath]);

  // Sync section if arrived via URL route
  useEffect(() => {
    if (!routeInfo.isNotFound && routeInfo.section) {
      setActiveSection(routeInfo.section);
    } else if (routeInfo.isNotFound) {
      triggerCatReaction("LOST_ROUTE");
    }
  }, [routeInfo, triggerCatReaction]);

  const navigateToSection = (section: string) => {
    setActiveSection(section);
    setMobileNavOpen(false);
    const targetPath =
      section === "Overview"
        ? "/"
        : section === "Your Market"
        ? "/your-market"
        : `/${section.toLowerCase()}`;
    navigateTo(targetPath);
    setCurrentPath(targetPath);
  };

  const handleNavigateHome = () => {
    navigateTo("/");
    setCurrentPath("/");
    setActiveSection("Overview");
  };

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      handleNavigateHome();
    }
  };

  // Reactive symbol resolution: orders re-map automatically whenever stocks or rawOrders change
  const orders = useMemo(() => {
    return mapApiOrders(rawOrders, stocks, 100);
  }, [rawOrders, stocks]);

  // Reconcile order status transitions (completed trades, partial fills, cancellations)
  // Ensures notifications are created accurately with real execution data, without duplicates
  useEffect(() => {
    if (!demoUserId || rawOrders.length === 0) return;

    rawOrders.forEach((order) => {
      const stock = stocks.find((s) => s.id === order.stockId);
      const symbol = stock?.symbol || `ID:${order.stockId}`;
      const priceNum = Number(order.price) || 0;

      if (order.status === "FILLED") {
        if (!hasOrderNotificationBeenSent(demoUserId, order.id, "FILLED")) {
          recordOrderNotificationSent(demoUserId, order.id, "FILLED");
          const msg = formatOrderFilledMessage(order.type, symbol, order.quantity, priceNum);
          pushNotification({
            type: "ORDER_FILLED",
            title: "Shadow Cat — Order filled",
            message: msg,
            expression: "blessed",
            orderId: order.id,
            symbol,
            side: order.type,
            quantity: order.quantity,
            price: priceNum,
            executedQuantity: order.quantity,
          });
          triggerCatReaction("ORDER_FILLED");
          unlockAchievement("first_fill", demoUserId);

          // Trigger celebration modal in Extreme mode
          if (preferences.personalityMode === "extreme" && preferences.extremeCelebrations !== false) {
            setCelebrationOrder({
              orderId: order.id,
              symbol,
              side: order.type,
              quantity: order.quantity,
              price: priceNum,
            });
          }
        }
      } else if (order.status === "PARTIALLY_FILLED") {
        if (!hasOrderNotificationBeenSent(demoUserId, order.id, "PARTIALLY_FILLED")) {
          recordOrderNotificationSent(demoUserId, order.id, "PARTIALLY_FILLED");
          const msg = formatOrderPartiallyFilledMessage(order.type, symbol, order.quantity, priceNum);
          pushNotification({
            type: "ORDER_PARTIALLY_FILLED",
            title: `Order #${order.id} Partially Filled`,
            message: msg,
            expression: "profit",
            orderId: order.id,
            symbol,
            side: order.type,
            quantity: order.quantity,
            price: priceNum,
            executedQuantity: order.quantity,
          });
          triggerCatReaction("ORDER_PARTIALLY_FILLED");
        }
      }
    });
  }, [rawOrders, demoUserId, stocks, preferences.personalityMode, preferences.extremeCelebrations, pushNotification, triggerCatReaction]);

  const refreshUserOrdersAndPortfolio = useCallback(async () => {
    const currentId = demoUserId;
    if (!currentId) return;
    try {
      const [savedOrders, refreshedUser, refreshedPortfolio] = await Promise.all([
        getOrders(currentId),
        getUser(currentId),
        getPortfolio(currentId),
      ]);
      if (!isMountedRef.current || activeUserIdRef.current !== currentId) {
        return;
      }
      setRawOrders(savedOrders);
      setAccount(refreshedUser);
      setPortfolio(refreshedPortfolio);
    } catch (err) {
      if (isMountedRef.current && activeUserIdRef.current === currentId) {
        console.warn("Failed to refresh user orders/portfolio after trade:", err);
      }
    }
  }, [demoUserId]);

  const { scheduleRefresh, cancelRefresh } = useTradeRefresh(refreshUserOrdersAndPortfolio, 100);

  useEffect(() => {
    cancelRefresh();
  }, [demoUserId, cancelRefresh]);

  const handleTradePrint = useCallback(
    (_trade: PublicTradeResponse) => {
      scheduleRefresh();
      if (preferences.soundEnabled) {
        playTradeSound();
      }
    },
    [scheduleRefresh, preferences.soundEnabled]
  );

  const { trades: recentTrades, status: tradeStreamStatus } = useTradeStream({
    onTrade: handleTradePrint,
  });

  const loadStocks = useCallback(async () => {
    setStocksLoading(true);
    setStocksError("");
    try {
      const apiStocks = await getStocks();
      if (!isMountedRef.current) return;

      const mappedStocks: Stock[] = apiStocks.map((stock) => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.companyName,
        price: Number(stock.currentPrice),
        points: getChartPoints(stock.symbol),
      }));

      setStocks(mappedStocks);
      setSelectedSymbol((current) =>
        mappedStocks.some((stock) => stock.symbol === current)
          ? current
          : (mappedStocks[0]?.symbol ?? ""),
      );
      if (mappedStocks.length === 0) {
        setStocksError("The API responded, but there are no instruments in the exchange yet.");
      }
    } catch (error: unknown) {
      if (isMountedRef.current) {
        setStocksError(error instanceof Error ? error.message : "Unable to connect to the exchange API.");
      }
    } finally {
      if (isMountedRef.current) {
        setStocksLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadStocks();
  }, [loadStocks]);

  useEffect(() => {
    let cancelled = false;
    async function loadDemoAccount() {
      try {
        const storedId = window.localStorage.getItem("shadow-exchange-demo-user-id-v2");
        let user;
        if (storedId && /^\d+$/.test(storedId)) {
          try { user = await getUser(Number(storedId)); }
          catch { /* H2/Neon restart fallback. */ }
        }
        if (!user) {
          user = await createDemoUser();
          window.localStorage.setItem("shadow-exchange-demo-user-id-v2", String(user.id));
          assignRandomIdentityForUser(user.id);
          if (!window.localStorage.getItem(`shadow_onboarded_user_${user.id}`)) {
            setOnboardingOpen(true);
            window.localStorage.setItem(`shadow_onboarded_user_${user.id}`, "true");
          }
        }
        if (!cancelled) {
          setDemoUserId(user.id);
          const [savedOrders, userHoldings] = await Promise.all([
            getOrders(user.id).catch(() => []),
            getPortfolio(user.id).catch(() => []),
          ]);
          if (!cancelled) {
            setRawOrders(savedOrders);
            setPortfolio(userHoldings);
          }
        }
      } catch (error) {
        if (!cancelled) setToast(error instanceof Error ? `Demo account unavailable: ${error.message}` : "Demo account unavailable.");
      } finally {
        if (!cancelled) setAccountLoading(false);
      }
    }
    void loadDemoAccount();
    return () => { cancelled = true; };
  }, []);

  const handleSwitchNewDemoUser = async () => {
    setAccountLoading(true);
    try {
      const newUser = await createDemoUser();
      window.localStorage.setItem("shadow-exchange-demo-user-id-v2", String(newUser.id));
      assignRandomIdentityForUser(newUser.id);
      setDemoUserId(newUser.id);
      setAccount(newUser);
      const [savedOrders, userHoldings] = await Promise.all([
        getOrders(newUser.id).catch(() => []),
        getPortfolio(newUser.id).catch(() => []),
      ]);
      setRawOrders(savedOrders);
      setPortfolio(userHoldings);
      setToast(`Switched to new demo account #${newUser.id}.`);
      if (!window.localStorage.getItem(`shadow_onboarded_user_${newUser.id}`)) {
        setOnboardingOpen(true);
        window.localStorage.setItem(`shadow_onboarded_user_${newUser.id}`, "true");
      }
    } catch (err) {
      setToast(err instanceof Error ? `Failed to create demo account: ${err.message}` : "Failed to create demo account.");
    } finally {
      setAccountLoading(false);
    }
  };

  useEffect(() => {
    if (!demoUserId) return;
    let cancelled = false;

    const syncAccountAndPortfolio = async (showLoading = false) => {
      if (showLoading) setPortfolioLoading(true);
      try {
        const [user, holdings] = await Promise.all([
          getUser(demoUserId),
          getPortfolio(demoUserId),
        ]);
        if (!cancelled) {
          setAccount(user);
          setPortfolio(holdings);
        }
      } catch (error: unknown) {
        if (!cancelled && showLoading) {
          setToast(error instanceof Error ? `Account data unavailable: ${error.message}` : "Account data unavailable.");
        }
      } finally {
        if (!cancelled && showLoading) setPortfolioLoading(false);
      }
    };

    void syncAccountAndPortfolio(true);
    const intervalId = window.setInterval(() => {
      void syncAccountAndPortfolio(false);
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [demoUserId, rawOrders]);

  const selectedStockId = stocks.find((stock) => stock.symbol === selectedSymbol)?.id ?? 0;

  useEffect(() => {
    if (!selectedStockId) {
      setOrderBook(null);
      return;
    }

    let cancelled = false;

    const refreshOrderBook = async (showLoading = false) => {
      if (showLoading) setOrderBookLoading(true);
      try {
        const book = await getOrderBook(selectedStockId);
        if (!cancelled) {
          setOrderBook(book);
          setOrderBookError("");
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setOrderBookError(error instanceof Error ? error.message : "Unable to refresh market depth.");
        }
      } finally {
        if (!cancelled && showLoading) setOrderBookLoading(false);
      }
    };

    void refreshOrderBook(true);
    const intervalId = window.setInterval(() => {
      void refreshOrderBook();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedStockId, rawOrders]);

  const selectedStock = stocks.find((stock) => stock.symbol === selectedSymbol) ?? stocks[0] ?? {
    id: 0,
    symbol: "—",
    name: "No instrument selected",
    price: 0,
    points: DEFAULT_CHART_POINTS,
  };

  const chartHistory = useMemo(() => {
    return getChartHistory(selectedStock.symbol, selectedTimeframe, selectedStock.price || 150.0);
  }, [selectedStock.symbol, selectedTimeframe, selectedStock.price]);

  const marketPulse = useMemo(() => getMarketPulseIndicators(), []);

  const filteredStocks = stocks.filter((stock) =>
    `${stock.symbol} ${stock.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const estimatedValue = Math.max(0, Number(quantity) || 0) * Math.max(0, Number(limitPrice) || 0);

  const cashBalance = Number(account?.balance ?? 0);
  const reservedCash = Number(account?.reservedBalance ?? 0);
  const availableCash = Math.max(0, cashBalance - reservedCash);
  const totalMarketValue = portfolio.reduce((total, holding) => total + Number(holding.marketValue), 0);
  const totalEquity = cashBalance + totalMarketValue;
  const totalSharesReserved = portfolio.reduce((total, holding) => total + holding.reservedQuantity, 0);

  const selectedHolding = portfolio.find((item) => item.stockId === selectedStock.id || item.symbol === selectedStock.symbol);
  const availableShares = selectedHolding ? selectedHolding.availableQuantity : 0;
  const reservedShares = selectedHolding ? selectedHolding.reservedQuantity : 0;

  const isPriceValid = useMemo(() => {
    const p = Number(limitPrice);
    return Number.isFinite(p) && p > 0;
  }, [limitPrice]);

  const isQuantityValid = useMemo(() => {
    const q = Number(quantity);
    return Number.isInteger(q) && q >= 1;
  }, [quantity]);

  const isDataReady = Boolean(
    !stocksLoading &&
    stocks.length > 0 &&
    !stocksError &&
    selectedStock.id &&
    !accountLoading &&
    account &&
    demoUserId &&
    !submittingOrder &&
    (side === "BUY" || !portfolioLoading)
  );

  const hasSufficientFundsOrShares = useMemo(() => {
    if (!isPriceValid || !isQuantityValid) return false;
    const parsedPrice = Number(limitPrice);
    const parsedQuantity = Number(quantity);

    if (side === "BUY") {
      const requiredFunds = Number((parsedPrice * parsedQuantity).toFixed(2));
      const roundedAvailableCash = Number(availableCash.toFixed(2));
      return requiredFunds <= roundedAvailableCash;
    } else {
      return parsedQuantity <= availableShares;
    }
  }, [isPriceValid, isQuantityValid, side, limitPrice, quantity, availableCash, availableShares]);

  const canSubmitOrder = Boolean(isDataReady && isPriceValid && isQuantityValid && hasSufficientFundsOrShares);

  const orderValidationWarning = useMemo(() => {
    if (side === "SELL" && availableShares === 0) {
      const hasOtherHoldingsWithShares = portfolio.some((h) => {
        const avail = h.availableQuantity ?? (h.quantity - (h.reservedQuantity ?? 0));
        return avail > 0;
      });
      return hasOtherHoldingsWithShares
        ? `You hold 0 available shares of ${selectedStock.symbol}. Click Change to select from your sellable holdings.`
        : `You hold 0 available shares of ${selectedStock.symbol}. Buy shares first before placing sell orders.`;
    }
    if (!isPriceValid) {
      return "Enter a valid limit price greater than $0.00.";
    }
    if (!isQuantityValid) {
      return "Enter a whole-share quantity of at least 1.";
    }

    const parsedPrice = Number(limitPrice);
    const parsedQuantity = Number(quantity);

    if (side === "BUY") {
      const requiredFunds = Number((parsedPrice * parsedQuantity).toFixed(2));
      const roundedAvailableCash = Number(availableCash.toFixed(2));
      if (requiredFunds > roundedAvailableCash) {
        return `Order value exceeds available cash (${money(availableCash)}).`;
      }
    } else {
      if (parsedQuantity > availableShares) {
        return `Quantity exceeds available shares (${availableShares} ${selectedStock.symbol}).`;
      }
    }

    return null;
  }, [
    side,
    availableShares,
    selectedStock.symbol,
    portfolio,
    isPriceValid,
    isQuantityValid,
    limitPrice,
    quantity,
    availableCash,
  ]);

  const applyMaxQuantity = () => {
    if (side === "BUY") {
      const price = Number(limitPrice) || selectedStock.price;
      if (Number.isFinite(price) && price > 0) {
        const maxShares = Math.floor(availableCash / price);
        if (maxShares >= 1) {
          setQuantity(String(maxShares));
        } else {
          setQuantity("0");
          setToast("Insufficient available cash to afford a whole share.");
        }
      } else {
        setToast("Enter a valid limit price to calculate max shares.");
      }
    } else {
      if (availableShares >= 1) {
        setQuantity(String(availableShares));
      } else {
        setQuantity("0");
        setToast(`You do not have any available shares of ${selectedStock.symbol} to sell.`);
      }
    }
  };

  const chooseStock = (stock: Stock) => {
    setSelectedSymbol(stock.symbol);
    if (stock.price > 0) {
      setLimitPrice(stock.price.toFixed(2));
    }
    if (preferences.defaultQuantity) {
      setQuantity(String(preferences.defaultQuantity));
    }
  };

  const handleSelectFromPicker = (stock: Stock) => {
    chooseStock(stock);
    if (activeSection === "Your Market") {
      handleAddPersonalizedSymbol(stock.symbol);
    }
  };

  const placeDemoOrder = async () => {
    if (!canSubmitOrder) return;
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(limitPrice);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setToast("Enter a valid quantity and limit price.");
      return;
    }
    if (!demoUserId || !selectedStock.id) {
      setToast("The demo account or selected instrument is not ready yet.");
      return;
    }
    setSubmittingOrder(true);
    try {
      const response = await submitOrder({
        userId: demoUserId,
        stockId: selectedStock.id,
        type: side,
        price: parsedPrice,
        quantity: parsedQuantity,
      });
      const [savedOrders, refreshedUser, refreshedPortfolio] = await Promise.all([
        getOrders(demoUserId),
        getUser(demoUserId),
        getPortfolio(demoUserId),
      ]);
      setRawOrders(savedOrders);
      setAccount(refreshedUser);
      setPortfolio(refreshedPortfolio);
      const latestOrder = savedOrders.find((order) => order.id === response.id);
      const finalStatus = latestOrder?.status ?? response.status;
      setToast(`Order #${response.id} accepted by the exchange · ${finalStatus}`);

      if (finalStatus === "FILLED") {
        recordOrderNotificationSent(demoUserId, response.id, "FILLED");
        triggerCatReaction("ORDER_FILLED");
        const msg = formatOrderFilledMessage(side, selectedStock.symbol, parsedQuantity, parsedPrice);
        pushNotification({
          type: "ORDER_FILLED",
          title: "Shadow Cat — Order filled",
          message: msg,
          expression: "blessed",
          orderId: response.id,
          symbol: selectedStock.symbol,
          side,
          quantity: parsedQuantity,
          price: parsedPrice,
          executedQuantity: parsedQuantity,
        });
        unlockAchievement("first_fill", demoUserId);

        if (preferences.personalityMode === "extreme" && preferences.extremeCelebrations !== false) {
          setCelebrationOrder({
            orderId: response.id,
            symbol: selectedStock.symbol,
            side,
            quantity: parsedQuantity,
            price: parsedPrice,
          });
        }
      } else {
        recordOrderNotificationSent(demoUserId, response.id, "SUBMITTED");
        const isLowball = side === "BUY" && selectedStock.price > 0 && parsedPrice < selectedStock.price * 0.75;
        if (isLowball) {
          triggerCatReaction("LOWBALL_OFFER");
        } else {
          triggerCatReaction("ORDER_SUBMITTED");
        }
        pushNotification({
          type: "ORDER_SUBMITTED",
          title: `Order #${response.id} Submitted`,
          message: `${side} ${parsedQuantity} ${selectedStock.symbol} limit order placed at $${parsedPrice.toFixed(2)}.`,
          expression: isLowball ? "suspicious" : "neutral",
          orderId: response.id,
          symbol: selectedStock.symbol,
          side,
          quantity: parsedQuantity,
          price: parsedPrice,
        });
        unlockAchievement("first_order", demoUserId);

        // Prominent manual-dismiss celebration popup for order placement under Extreme mode
        if (preferences.personalityMode === "extreme") {
          setPlacementOrder({
            orderId: response.id,
            symbol: selectedStock.symbol,
            side,
            quantity: parsedQuantity,
            price: parsedPrice,
            status: finalStatus,
            dialogueIndex: Math.floor(Math.random() * 6),
          });
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "The exchange could not place this order.";
      setToast(`Order rejected: ${errMsg}`);
      const isFunds = errMsg.toLowerCase().includes("balance") || errMsg.toLowerCase().includes("funds");
      if (isFunds) {
        triggerCatReaction("INSUFFICIENT_FUNDS");
      } else {
        triggerCatReaction("ORDER_REJECTED");
      }
      pushNotification({
        type: "ORDER_REJECTED",
        title: "Order Placement Rejected",
        message: errMsg,
        expression: isFunds ? "broke" : "suspicious",
        symbol: selectedStock.symbol,
      });
    } finally {
      setSubmittingOrder(false);
    }
  };

  const cancelPendingOrder = async (order: LocalOrder) => {
    if (order.status !== "PENDING" && order.status !== "PARTIALLY_FILLED") {
      setToast("Only pending or partially filled orders can be cancelled.");
      return;
    }

    try {
      await cancelOrder(order.id);
      if (demoUserId) {
        const [savedOrders, refreshedUser, refreshedPortfolio] = await Promise.all([
          getOrders(demoUserId),
          getUser(demoUserId),
          getPortfolio(demoUserId),
        ]);
        setRawOrders(savedOrders);
        setAccount(refreshedUser);
        setPortfolio(refreshedPortfolio);
      }
      recordOrderNotificationSent(demoUserId, order.id, "CANCELLED");
      setToast(`Order #${order.id} cancelled. Reserved funds or shares have been released.`);
      triggerCatReaction("ORDER_CANCELLED");
      pushNotification({
        type: "ORDER_CANCELLED",
        title: `Order #${order.id} Cancelled`,
        message: `${order.side} ${order.quantity} ${order.symbol} cancelled. Reserved funds released.`,
        expression: "neutral",
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: Number(order.price) || 0,
      });
      unlockAchievement("first_cancellation", demoUserId);
    } catch (error) {
      setToast(error instanceof Error ? `Cancellation failed: ${error.message}` : "The exchange could not cancel this order.");
    }
  };

  const handleTopbarSearch = () => {
    if (activeSection !== "Overview" && activeSection !== "Markets") {
      navigateToSection("Overview");
    }
    setTimeout(() => {
      const input = document.getElementById(activeSection === "Markets" ? "markets-view-search" : "market-search");
      input?.focus();
    }, 60);
  };

  // If path is unknown, render the cat-themed 404 page
  if (routeInfo.isNotFound) {
    return (
      <NotFoundPage
        onNavigateHome={handleNavigateHome}
        onGoBack={handleGoBack}
        attemptedPath={currentPath}
      />
    );
  }

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Markets", icon: SlidersHorizontal },
    { label: "Your Market", icon: Star },
    { label: "Portfolio", icon: Wallet },
    { label: "Activity", icon: Activity },
  ];

  return (
    <div className={`app-shell ${preferences.density === "compact" ? "density-compact" : ""}`}>
      {mobileNavOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`} aria-label="Sidebar">
        <div className="sidebar-header">
          <a
            className="brand"
            href="#"
            onClick={(e) => { e.preventDefault(); navigateToSection("Overview"); }}
            aria-label="Shadow Exchange home"
          >
            <span className="brand-mark">
              <ShadowCat
                expression="neutral"
                size={24}
                interactive={true}
                trackCursor={preferences.personalityMode === "extreme" && preferences.extremeCursorTrack !== false}
                reducedMotion={preferences.reduceMotion}
                onCatClick={() => {
                  if (preferences.personalityMode === "extreme") {
                    triggerCatReaction("ONBOARDING_COMPLETED", "Meow. Terminal presence acknowledged.");
                  }
                }}
              />
            </span>
            <span className="brand-word">SHADOW<span>EXCHANGE</span></span>
          </a>
          <button
            className="mobile-nav-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE <span>01</span></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activeSection === label ? "active" : ""}`}
              onClick={() => navigateToSection(label)}
            >
              <Icon size={16} strokeWidth={1.7} />
              <span>{label}</span>
              {label === "Activity" && <span className="nav-count">{orders.length}</span>}
              {label === "Markets" && <span className="nav-count">{stocks.length}</span>}
              {label === "Your Market" && <span className="nav-count">{personalizedSymbols.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className={`status-light ${stocksError ? "is-error" : ""}`} />
            <div>
              <strong>Exchange API</strong>
              <small>{stocksLoading ? "Connecting…" : stocksError ? "Needs attention" : accountLoading ? "Preparing demo account…" : demoUserId ? "Demo account ready" : "Account unavailable"}</small>
            </div>
            <span className="status-pulse" />
          </div>
          <button
            className="nav-item utility-item"
            type="button"
            onClick={() => setPreferencesOpen(true)}
          >
            <Settings2 size={16} />
            <span>Preferences</span>
          </button>
          <button
            className="nav-item utility-item"
            type="button"
            onClick={() => setToast("Help centre & documentation is in development.")}
          >
            <CircleHelp size={16} />
            <span>Help &amp; documentation</span>
          </button>
          <div className="profile-container">
            <button
              type="button"
              className="profile-row interactive-profile-row"
              onClick={() => setProfileMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              aria-label="Open demo operator profile menu"
            >
              <div className="profile-avatar identity-sidebar-avatar" style={{ borderColor: identity.accentColor }}>
                <IdentityIcon identity={identity} size={18} />
              </div>
              <div className="profile-copy">
                <strong title={identity.name}>{identity.name}</strong>
                <small title={accountLoading ? "Connecting…" : `${money(availableCash)} cash`}>
                  {accountLoading ? "Connecting…" : `${money(availableCash)} cash`}
                </small>
              </div>
              <ChevronDown size={15} className={`profile-chevron ${profileMenuOpen ? "is-open" : ""}`} />
            </button>
            <ProfileMenu
              isOpen={profileMenuOpen}
              onClose={() => setProfileMenuOpen(false)}
              account={account}
              demoUserId={demoUserId}
              identity={identity}
              availableCash={availableCash}
              reservedCash={reservedCash}
              totalEquity={totalEquity}
              onOpenIdentityPicker={() => setIdentityPickerOpen(true)}
              onSwitchNewDemoUser={handleSwitchNewDemoUser}
              onToast={setToast}
            />
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeSection}</strong></div>
          <div className="topbar-actions">
            <div className="session-pill"><span className="status-light" /> SIMULATED SESSION</div>
            <button className="icon-button" aria-label="Search markets" onClick={handleTopbarSearch}><Search size={17} /></button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotificationsOpen(true)}>
              <Bell size={17} />
              {notifications.some((n) => !n.read) && <i />}
            </button>
            <span className="topbar-divider" />
            <button className="shortcut-button" aria-label="Command Palette" onClick={() => setCommandPaletteOpen(true)} title="Command Palette (Cmd+K)">
              <Command size={13} /> <span>K</span>
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> MARKET INTELLIGENCE <span className="eyebrow-index">/ 001</span></div>
              <h1>{activeSection === "Overview" ? <>The market,<br /><em>without the noise.</em></> : <>{activeSection}<br /><em>at a glance.</em></>}</h1>
              <p className="heading-description">A considered view of the market. Every signal, nothing superfluous.</p>
            </div>
          </section>

          {/* Live Multi-Timezone Financial Center Clocks */}
          <WorldClocks />

          <section className="market-ribbon" aria-label="Market summary">
            <div className="ribbon-heading"><span className="ribbon-dot" /> MARKET PULSE</div>
            {marketPulse.map((ind) => (
              <div className="ribbon-stat" key={ind.id}>
                <span>{ind.name}</span>
                <strong>{ind.formattedValue}</strong>
                <small className={ind.isPositive ? "positive" : "negative"}>
                  {ind.isPositive ? "+" : "−"}{Math.abs(ind.changePercent).toFixed(2)}%
                </small>
                <Sparkline points={ind.sparkline} negative={!ind.isPositive} />
              </div>
            ))}
            <div className="ribbon-footnote">SIMULATED BENCHMARKS <span>·</span> 30M CADENCE <span>·</span> DETERMINISTIC</div>
          </section>

          {activeSection === "Portfolio" ? (
            <section className="portfolio-view">
              <div className="portfolio-summary-grid">
                <article className="portfolio-metric"><span>NET ACCOUNT VALUE</span><strong>{money(totalEquity)}</strong><small>Cash + stock market value</small></article>
                <article className="portfolio-metric"><span>AVAILABLE CASH</span><strong>{money(availableCash)}</strong><small>Cash ready to deploy</small></article>
                <article className="portfolio-metric"><span>RESERVED CASH</span><strong>{money(reservedCash)}</strong><small>Committed to open buy orders</small></article>
                <article className="portfolio-metric"><span>MARKET VALUE</span><strong>{money(totalMarketValue)}</strong><small>Based on current listed prices</small></article>
                <article className="portfolio-metric"><span>POSITIONS &amp; RESERVED</span><strong>{portfolio.length.toString().padStart(2, "0")} <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--muted)" }}>/ {totalSharesReserved} res</span></strong><small>Active holdings / shares locked</small></article>
              </div>
              <section className="panel portfolio-table-panel">
                <div className="panel-topline"><div className="panel-label"><span className="panel-index">06</span> YOUR POSITIONS</div>
                  <button className="subtle-button" onClick={() => {
                    if (demoUserId) {
                      setPortfolioLoading(true);
                      Promise.all([
                        getPortfolio(demoUserId).then(setPortfolio),
                        getUser(demoUserId).then(setAccount),
                      ])
                        .catch((error: unknown) => setToast(error instanceof Error ? error.message : "Unable to refresh portfolio."))
                        .finally(() => setPortfolioLoading(false));
                    }
                  }}>Refresh <ArrowUpRight size={13} /></button>
                </div>
                <div className="portfolio-table">
                  <div className="portfolio-table-head"><span>INSTRUMENT</span><span>TOTAL</span><span>AVAILABLE</span><span>RESERVED</span><span>PRICE</span><span>MARKET VALUE</span></div>
                  {portfolio.map((holding) => <button className="portfolio-row" key={holding.id} onClick={() => {
                    const stock = stocks.find((item) => item.id === holding.stockId);
                    if (stock) chooseStock(stock);
                    navigateToSection("Overview");
                  }}>
                    <span className="portfolio-instrument"><span className="ticker-avatar">{holding.symbol.slice(0, 1)}</span><span><strong>{holding.symbol}</strong><small>{holding.companyName}</small></span></span>
                    <strong>{holding.quantity}</strong><span>{holding.availableQuantity}</span><span>{holding.reservedQuantity}</span><span>{money(Number(holding.currentPrice))}</span><strong>{money(Number(holding.marketValue))}</strong>
                  </button>)}
                  {portfolioLoading && <div className="empty-state">Loading account positions…</div>}
                  {!portfolioLoading && portfolio.length === 0 && (
                    <div className="terminal-empty-card">
                      <ShadowCat expression="thinking" size={54} />
                      <p>No holdings in this account yet.</p>
                      <small>Submit a limit buy order in the trading terminal to build your portfolio positions.</small>
                      <button
                        type="button"
                        className="not-found-primary-btn"
                        onClick={() => navigateToSection("Overview")}
                        style={{ marginTop: "14px" }}
                      >
                        <Terminal size={14} />
                        <span>Trade in Terminal</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="portfolio-note"><ShieldCheck size={14} /> Values use the exchange's listed prices and are illustrative, not live market data.</div>
              </section>
            </section>
          ) : activeSection === "Your Market" ? (
            <YourMarketView
              allStocks={stocks}
              watchedSymbols={watchedSymbols}
              personalizedSymbols={personalizedSymbols}
              onSelectStock={chooseStock}
              onToggleWatchSymbol={handleToggleWatchSymbol}
              onRemovePersonalizedSymbol={handleRemovePersonalizedSymbol}
              onNavigateToOverview={() => navigateToSection("Overview")}
              onOpenInstrumentPicker={() => {
                setPickerMode("BUY");
                setPickerOpen(true);
              }}
            />
          ) : activeSection === "Markets" ? (
            <MarketsView
              stocks={stocks}
              stocksLoading={stocksLoading}
              stocksError={stocksError}
              selectedSymbol={selectedSymbol}
              onSelectStock={chooseStock}
              onNavigateToOverview={() => navigateToSection("Overview")}
              onRetry={loadStocks}
              watchedSymbols={watchedSymbols}
              onToggleWatchSymbol={handleToggleWatchSymbol}
            />
          ) : activeSection === "Activity" ? (
            <ActivityView
              orders={orders}
              onCancelOrder={cancelPendingOrder}
              onRefresh={() => {
                if (demoUserId) {
                  getOrders(demoUserId).then(setRawOrders).catch(() => {});
                }
              }}
              isLoading={accountLoading}
            />
          ) : (
            <>
              <div className="content-grid">
                <div className="left-column">
                  <section className="panel featured-panel">
                    <div className="panel-topline">
                      <div className="panel-label"><span className="panel-index">01</span> IN FOCUS</div>
                      <button className="subtle-button" onClick={() => navigateToSection("Markets")}>All markets <ArrowUpRight size={13} /></button>
                    </div>
                    <div className="featured-asset">
                      <div className="asset-identity">
                        <div className="asset-monogram">{selectedStock.symbol.slice(0, 1)}</div>
                        <div><div className="asset-symbol">{selectedStock.symbol}<span className="asset-exchange">NASDAQ</span></div><div className="asset-name">{selectedStock.name}</div></div>
                      </div>
                      <div className="asset-price-block">
                        <div className="asset-price">{selectedStock.price > 0 ? money(selectedStock.price) : "Quote pending"}</div>
                        <div className="asset-change"><span>SIMULATED BENCHMARK PRICE</span></div>
                      </div>
                    </div>
                    <div className="chart-toolbar">
                      <div className="chart-legend">
                        <span className="legend-dot" /> PRICE{" "}
                        <span className="legend-value">{selectedStock.price > 0 ? money(selectedStock.price) : "Quote pending"}</span>
                        <span className="timeframe-badge">{selectedTimeframe}</span>
                      </div>
                      <div className="timeframes">
                        {(["1D", "1W", "1M", "1Y"] as ChartTimeframe[]).map((frame) => (
                          <button
                            key={frame}
                            className={selectedTimeframe === frame ? "selected" : ""}
                            onClick={() => setSelectedTimeframe(frame)}
                          >
                            {frame}
                          </button>
                        ))}
                      </div>
                    </div>
                    <MarketChart chartHistory={chartHistory} symbol={selectedStock.symbol} />
                    <div className="chart-footer">
                      <span>OPEN <strong>{money(chartHistory.periodOpen)}</strong></span>
                      <span>HIGH <strong>{money(chartHistory.periodHigh)}</strong></span>
                      <span>LOW <strong>{money(chartHistory.periodLow)}</strong></span>
                      <span>CHANGE <strong className={chartHistory.change >= 0 ? "positive" : "negative"}>{chartHistory.change >= 0 ? "+" : ""}{chartHistory.changePercent.toFixed(2)}%</strong></span>
                      <span>SOURCE <strong>SIMULATED HISTORY</strong></span>
                    </div>
                  </section>

                  <section className="panel watchlist-panel">
                    <div className="panel-topline">
                      <div className="panel-label"><span className="panel-index">02</span> WATCHLIST <span className="panel-count">{stocks.length.toString().padStart(2, "0")} ASSETS</span></div>
                      <label className="search-field"><Search size={14} /><input id="market-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an asset" /></label>
                    </div>
                    <div className="watchlist-table">
                      <div className="table-head"><span>INSTRUMENT</span><span>LAST PRICE</span><span>24H CHANGE</span><span className="spark-head">TREND</span><span /></div>
                      <div className="watchlist-rows-scroll">
                        {filteredStocks.map((stock) => {
                          const isFavorited = watchedSymbols.includes(stock.symbol);
                          return (
                            <div
                              key={stock.id}
                              className={`watchlist-row ${selectedSymbol === stock.symbol ? "chosen" : ""}`}
                              onClick={() => chooseStock(stock)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  if (e.target === e.currentTarget) {
                                    chooseStock(stock);
                                  }
                                }
                              }}
                            >
                              <span className="table-asset">
                                <button
                                  type="button"
                                  className={`star-watch-btn inline-star-btn ${isFavorited ? "is-watched" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleWatchSymbol(stock.symbol);
                                  }}
                                  title={isFavorited ? `Remove ${stock.symbol} from favorites` : `Mark ${stock.symbol} as favorite`}
                                  aria-label={isFavorited ? `Remove ${stock.symbol} from favorites` : `Mark ${stock.symbol} as favorite`}
                                >
                                  <Star size={11} fill={isFavorited ? "currentColor" : "none"} />
                                </button>
                                <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
                                <span><strong>{stock.symbol}</strong><small>{stock.name}</small></span>
                              </span>
                              <span className="table-price">{stock.price > 0 ? money(stock.price) : "Quote pending"}</span>
                              <span className="table-change">—</span>
                              <span className="table-spark"><Sparkline points={stock.points} /></span>
                              <span className="row-arrow"><ArrowUpRight size={14} /></span>
                            </div>
                          );
                        })}
                        {stocksLoading && (
                          <div className="empty-state">Connecting to exchange &amp; loading instruments…</div>
                        )}
                        {stocksError && (
                          <div className="empty-state is-error">
                            <span>{stocksError}</span>
                            <button type="button" className="subtle-button retry-btn" onClick={loadStocks}>
                              <RefreshCw size={13} /> Retry Connection
                            </button>
                          </div>
                        )}
                        {!stocksLoading && !stocksError && filteredStocks.length === 0 && (
                          <div className="empty-state">
                            {search ? `No instruments match “${search}”.` : "No instruments available."}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="watchlist-footer">
                      <span>SHOWING {filteredStocks.length.toString().padStart(2, "0")} OF {stocks.length.toString().padStart(2, "0")} INSTRUMENTS</span>
                      {search.trim().length > 0 && (
                        <button onClick={() => setSearch("")}>RESET FILTER <X size={11} /></button>
                      )}
                    </div>
                  </section>
                </div>

                <div className="right-column">
                  <section className="panel order-panel">
                    <div className="panel-topline">
                      <div className="panel-label"><span className="panel-index">03</span> ORDER TICKET</div>
                      <button className="tiny-icon-button" aria-label="Order ticket settings" onClick={() => setPreferencesOpen(true)} title="Preferences"><Settings2 size={14} /></button>
                    </div>
                    <div className="order-instrument">
                      <div><span className="field-caption">INSTRUMENT</span><strong>{selectedStock.symbol}<small> / USD</small></strong></div>
                      <button
                        className="change-instrument"
                        type="button"
                        onClick={() => {
                          setPickerMode(side);
                          setPickerOpen(true);
                        }}
                        aria-haspopup="dialog"
                        aria-label={`Change instrument (${side.toLowerCase()} mode)`}
                      >
                        CHANGE <ChevronDown size={12} />
                      </button>
                    </div>
                    <div className="side-switch" role="group" aria-label="Order side">
                      <button className={side === "BUY" ? "buy-active" : ""} onClick={() => setSide("BUY")}><ArrowUpRight size={15} /> BUY</button>
                      <button className={side === "SELL" ? "sell-active" : ""} onClick={() => setSide("SELL")}><ArrowDownRight size={15} /> SELL</button>
                    </div>
                    <div className={`order-balance-pill ${orderValidationWarning ? "is-warning" : ""}`}>
                      <span>{side === "BUY" ? "AVAILABLE CASH" : `AVAILABLE ${selectedStock.symbol}`}</span>
                      <strong>
                        {side === "BUY" ? (
                          <>
                            {money(availableCash)}
                            {reservedCash > 0 && <small>({money(reservedCash)} res)</small>}
                          </>
                        ) : (
                          <>
                            {availableShares} SHARES
                            {reservedShares > 0 && <small>({reservedShares} res)</small>}
                          </>
                        )}
                      </strong>
                    </div>
                    <div className="order-field">
                      <label htmlFor="order-type">ORDER TYPE</label>
                      <div id="order-type" className="order-type-badge-container">
                        <div className="order-type-chip">
                          <span className="order-type-tag">LIMIT</span>
                          <span className="order-type-explainer">Specified boundary price</span>
                        </div>
                        <span className="order-type-hint" title="Exchange matching engine executes limit orders strictly against opposing liquidity.">
                          SUPPORTED TYPE
                        </span>
                      </div>
                    </div>
                    <div className="order-field">
                      <label htmlFor="limit-price">LIMIT PRICE <span>USD</span></label>
                      <div className="number-input"><span>$</span><input id="limit-price" inputMode="decimal" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} /><button onClick={() => selectedStock.price > 0 && setLimitPrice(selectedStock.price.toFixed(2))}>MID</button></div>
                    </div>
                    <div className="order-field">
                      <label htmlFor="quantity">QUANTITY <span>SHARES</span></label>
                      <div className="number-input"><input id="quantity" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><div className="stepper"><button aria-label="Decrease quantity" onClick={() => setQuantity(String(Math.max(1, (Number(quantity) || 1) - 1)))}>−</button><button aria-label="Increase quantity" onClick={() => setQuantity(String(Math.max(1, Number(quantity) || 1) + 1))}>+</button></div></div>
                      <div className="quantity-presets">
                        {[1, 5, 10, 25].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            className={Number(quantity) === amount ? "selected" : ""}
                            onClick={() => setQuantity(String(amount))}
                          >
                            {amount}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="max-preset-btn"
                          onClick={applyMaxQuantity}
                          title={side === "BUY" ? "Max shares with available cash" : "Max available shares"}
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="order-estimate"><span>ESTIMATED ORDER VALUE</span><strong>{money(estimatedValue)}</strong></div>
                    {orderValidationWarning && <div className="order-warning-note">{orderValidationWarning}</div>}
                    <div className="order-note"><ShieldCheck size={14} /><span>Simulation only. No real funds or securities.</span></div>
                    <button
                      className={`submit-order ${side === "SELL" ? "sell-submit" : ""}`}
                      onClick={placeDemoOrder}
                      disabled={!canSubmitOrder}
                      aria-disabled={!canSubmitOrder}
                      title={!canSubmitOrder && orderValidationWarning ? orderValidationWarning : undefined}
                    >
                      {submittingOrder ? "Submitting order…" : side === "BUY" ? "Place buy order" : "Place sell order"}{" "}
                      <ArrowUpRight size={16} />
                    </button>
                    <div className="ticket-footnote">By continuing, you acknowledge this is a simulated market.</div>
                  </section>

                  <section className="panel depth-panel">
                    <div className="panel-topline">
                      <div className="panel-label"><span className="panel-index">04</span> MARKET DEPTH</div>
                      <span className="depth-live"><span className="status-light" /> API SYNC</span>
                    </div>
                    <div className="depth-head"><span>SIZE</span><span>BUY PRICE</span><span>SELL PRICE</span><span>SIZE</span></div>
                    {orderBookLoading && !orderBook ? (
                      <div className="empty-state">Loading persisted orders…</div>
                    ) : orderBookError ? (
                      <div className="empty-state">{orderBookError}</div>
                    ) : stocks.length === 0 ? (
                      <div className="empty-state">{stocksLoading ? "Connecting to exchange…" : "Market depth will appear when an instrument is available."}</div>
                    ) : (
                      <>
                        {(() => {
                          const aggregate = (bookOrders: ApiOrder[]) => {
                            const levels = new Map<number, number>();
                            bookOrders.forEach((order) => {
                              const price = Number(order.price);
                              levels.set(price, (levels.get(price) ?? 0) + order.quantity);
                            });
                            return [...levels.entries()]
                              .map(([price, size]) => ({ price, size }))
                              .sort((a, b) => a.price - b.price);
                          };
                          const bids = aggregate(orderBook?.bids ?? []).sort((a, b) => b.price - a.price).slice(0, 4);
                          const asks = aggregate(orderBook?.asks ?? []).slice(0, 4);
                          const rowCount = Math.max(bids.length, asks.length);
                          const bestBid = bids[0]?.price;
                          const bestAsk = asks[0]?.price;
                          const spread = bestBid !== undefined && bestAsk !== undefined ? bestAsk - bestBid : null;
                          const spreadPercent = spread !== null && bestAsk ? (spread / bestAsk) * 100 : null;
                          if (rowCount === 0) {
                            return <div className="empty-state">No open orders for {selectedStock.symbol}. Place a limit order to add liquidity.</div>;
                          }
                          return (
                            <>
                              {Array.from({ length: rowCount }, (_, index) => {
                                const bid = bids[index];
                                const ask = asks[index];
                                const maxSize = Math.max(1, ...bids.map((level) => level.size), ...asks.map((level) => level.size));
                                return (
                                  <div className="depth-row" key={index}>
                                    <span className="depth-size buy-depth" style={{ "--depth": `${((bid?.size ?? 0) / maxSize) * 100}%` } as CSSProperties & { "--depth": string }}>{bid?.size ?? "—"}</span>
                                    <strong className="positive">{bid ? money(bid.price) : "—"}</strong>
                                    <strong className="negative">{ask ? money(ask.price) : "—"}</strong>
                                    <span className="depth-size sell-depth" style={{ "--depth": `${((ask?.size ?? 0) / maxSize) * 100}%` } as CSSProperties & { "--depth": string }}>{ask?.size ?? "—"}</span>
                                  </div>
                                );
                              })}
                              <div className="depth-mid">
                                <span>{spread === null ? "SPREAD UNAVAILABLE" : "BEST BID / ASK SPREAD"}</span>
                                <strong>{spread === null ? "—" : money(spread)}{spreadPercent === null ? null : <small> {spreadPercent.toFixed(2)}%</small>}</strong>
                              </div>
                              <div className="depth-footnote">DATABASE ORDERS · {orderBook?.bids.length ?? 0} BIDS / {orderBook?.asks.length ?? 0} ASKS</div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </section>

                  <section className="panel recent-trades-panel">
                    <div className="panel-topline">
                      <div className="panel-label">
                        <span className="panel-index">05</span> RECENT TRADES
                      </div>
                      <span className={`trade-stream-status ${tradeStreamStatus.toLowerCase()}`}>
                        <span className={`status-light ${tradeStreamStatus === "CONNECTED" ? "" : tradeStreamStatus === "DISCONNECTED" ? "is-error" : "is-warning"}`} />
                        {tradeStreamStatus === "CONNECTED"
                          ? "LIVE STREAM"
                          : tradeStreamStatus === "RECONNECTING"
                          ? "RECONNECTING"
                          : tradeStreamStatus === "CONNECTING"
                          ? "CONNECTING"
                          : "OFFLINE"}
                      </span>
                    </div>
                    <div className="recent-trades-table">
                      <div className="trades-table-head">
                        <span>TIME</span>
                        <span>TICKER</span>
                        <span>PRICE</span>
                        <span>QTY</span>
                      </div>
                      {recentTrades.length === 0 ? (
                        <div className="empty-state">
                          {tradeStreamStatus === "CONNECTED"
                            ? "Listening for market prints on /topic/trades…"
                            : tradeStreamStatus === "RECONNECTING"
                            ? "Connection interrupted. Reconnecting…"
                            : tradeStreamStatus === "CONNECTING"
                            ? "Connecting to live trades feed…"
                            : "Live trade feed is offline."}
                        </div>
                      ) : (
                        <div className="trades-table-body">
                          {recentTrades.slice(0, 8).map((trade) => {
                            const timeStr = trade.executedAt
                              ? trade.executedAt.includes("T")
                                ? trade.executedAt.split("T")[1].slice(0, 8)
                                : trade.executedAt.slice(-8)
                              : "—";
                            return (
                              <div className="trade-row" key={trade.tradeId}>
                                <span className="trade-time">{timeStr}</span>
                                <span className="trade-symbol">
                                  <strong>{trade.symbol}</strong>
                                </span>
                                <span className="trade-price">{money(trade.price)}</span>
                                <span className="trade-quantity">{trade.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="trades-footnote">
                      <span>TOPIC <strong>/topic/trades</strong></span>
                      <span>FEED <strong>STOMP / WS</strong></span>
                    </div>
                  </section>
                </div>
              </div>

              <section className="panel activity-panel">
                <div className="panel-topline">
                  <div className="panel-label"><span className="panel-index">06</span> ORDER ACTIVITY <span className="panel-count">BACKEND CONFIRMED</span></div>
                  <button className="subtle-button" onClick={() => navigateToSection("Activity")}>View activity <ArrowUpRight size={13} /></button>
                </div>
                <div className="activity-table">
                  <div className="table-head"><span>ORDER</span><span>SIDE</span><span>INSTRUMENT</span><span>QUANTITY</span><span>LIMIT PRICE</span><span>STATUS</span><span>TIME</span><span>ACTION</span></div>
                  {orders.slice(0, 3).map((order) => (
                    <div className="activity-row" key={order.id}>
                      <span className="order-id">#{order.id}</span>
                      <span className={`activity-side ${order.side.toLowerCase()}`}>{order.side}</span>
                      <strong>{order.symbol}</strong>
                      <span>{order.quantity}</span>
                      <span>{money(order.price)}</span>
                      <span><i className={`status-indicator ${order.status.toLowerCase()}`} />{order.status}</span>
                      <span className="activity-time">{order.time}</span>
                      {(order.status === "PENDING" || order.status === "PARTIALLY_FILLED") && (
                        <button
                          className="cancel-order-button"
                          onClick={() => void cancelPendingOrder(order)}
                          aria-label={`Cancel order ${order.id}`}
                          title="Cancel pending order"
                        >CANCEL</button>
                      )}
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="terminal-empty-card">
                      <ShadowCat expression="thinking" size={48} />
                      <p>No orders placed yet.</p>
                      <small>Submit a limit buy or sell order in the ticket above to see execution activity.</small>
                    </div>
                  )}
                </div>
              </section>

              <footer className="page-footer">
                <div>
                  <span className="footer-brand-mark">
                    <ShadowCat expression="neutral" size={16} />
                  </span>
                  <span>SHADOW EXCHANGE</span>
                  <span className="footer-separator">/</span>
                  <span>BUILT FOR PRECISION.</span>
                </div>
                <div>
                  <span>DEMO ENVIRONMENT</span>
                  <span className="footer-separator">·</span>
                  <span>NOT FINANCIAL ADVICE</span>
                  <span className="footer-version">v0.2.0</span>
                </div>
              </footer>
            </>
          )}
        </div>
      </main>

      <InstrumentPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        stocks={stocks}
        selectedSymbol={selectedSymbol}
        onSelect={handleSelectFromPicker}
        mode={pickerMode}
        holdings={portfolio}
      />

      <IdentityPickerModal
        isOpen={identityPickerOpen}
        onClose={() => setIdentityPickerOpen(false)}
        selectedIdentity={identity}
        onSelectIdentity={handleSelectIdentity}
      />

      <PreferencesModal
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
      />

      <OrderCelebrationModal
        isOpen={Boolean(celebrationOrder)}
        onClose={() => setCelebrationOrder(null)}
        order={celebrationOrder}
        reduceMotion={preferences.reduceMotion}
      />

      <ExtremeOrderPlacementModal
        isOpen={Boolean(placementOrder)}
        onClose={() => setPlacementOrder(null)}
        order={placementOrder}
        reduceMotion={preferences.reduceMotion}
      />

      <PersonalityReactionBanner
        reaction={personalityReaction}
        onDismiss={() => setPersonalityReaction(null)}
      />

      <NotificationsFlyout
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onClearAll={handleClearAllNotifications}
        onDismissNotification={handleDismissNotification}
      />

      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigateSection={navigateToSection}
        onOpenInstrumentPicker={() => setPickerOpen(true)}
        onOpenIdentityPicker={() => setIdentityPickerOpen(true)}
        onOpenPreferences={() => setPreferencesOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      {toast && (
        <div className="toast" role="status">
          <span className="toast-mark">
            <ShadowCat expression="neutral" size={16} />
          </span>
          <span>{toast}</span>
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
      <button className="mobile-menu" type="button" aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}>{mobileNavOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </div>
  );
}

export default App;
