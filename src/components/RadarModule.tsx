import React, { useState, useEffect, useRef } from 'react';
import { Language, Contest } from '../types';
import { translations } from '../i18n/translations';
import { 
  Radio, Activity, RefreshCw, Terminal, CheckCircle2, AlertTriangle, 
  ExternalLink, Download, Layers, ShieldCheck, Search, Filter, 
  Sparkles, Check, Globe, Play, ChevronDown, ChevronUp, Cpu, Database,
  ArrowRight, ArrowLeft, PlusCircle, Trash2, CheckSquare, Square,
  CheckCheck, UploadCloud, X
} from 'lucide-react';
import { 
  ScrapeSource, ScrapedContestItem, ScrapeLogEntry 
} from '../types/radar';
import {
  OFFICIAL_RADAR_SOURCES, loadScrapedItems, saveScrapedItems,
  loadScrapeLogs, saveScrapeLogs, importScrapedContestToCatalog,
  loadImportedContests, normalizeScrapedItem,
  importMultipleScrapedContestsToCatalog, ignoreMultipleScrapedContests,
  loadSourceScanStats, saveSourceScanStat, SourceScanStat,
  resolveAdministrationLogo, deleteContestFromSystem
} from '../utils/radarStorage';
import { getSupabase } from '../lib/supabase';
import { publishScrapedToSupabase, publishManyScrapedToSupabase } from '../data/publishContest';

interface RadarModuleProps {
  language: Language;
  onSelectContest?: (contest: Contest) => void;
  onContestImported?: (contest: Contest) => void;
  onDeleteContest?: (contestId: string) => Promise<void> | void;
}

export const RadarModule: React.FC<RadarModuleProps> = ({
  language,
  onSelectContest,
  onContestImported,
  onDeleteContest,
}) => {
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [sources] = useState<ScrapeSource[]>(OFFICIAL_RADAR_SOURCES);
  const [scrapedItems, setScrapedItems] = useState<ScrapedContestItem[]>(loadScrapedItems());
  const [logs, setLogs] = useState<ScrapeLogEntry[]>(loadScrapeLogs());
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'imported'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [importedToast, setImportedToast] = useState<string | null>(null);
  // Source choisie par l'admin pour le prochain scan (aucun scan automatique).
  const [scanSourceId, setScanSourceId] = useState<string>(OFFICIAL_RADAR_SOURCES[0].id);
  const [scanningSourceId, setScanningSourceId] = useState<string | null>(null);
  const [scanStats, setScanStats] = useState<Record<string, SourceScanStat>>(loadSourceScanStats());
  const [isBackfilling, setIsBackfilling] = useState(false);
  // Préparation à l'analyse : le serveur stocke le texte et les fichiers de l'arrêté.
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareInfo, setPrepareInfo] = useState<string | null>(null);
  const [backfillProgress, setBackfillProgress] = useState(0);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTerminalExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isTerminalExpanded]);

  const addLog = (level: ScrapeLogEntry['level'], message: string, sourceId: string = 'radar-core') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog: ScrapeLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: timeStr,
      sourceId,
      level,
      message,
    };
    setLogs((prev) => {
      const updated = [newLog, ...prev.slice(0, 49)];
      saveScrapeLogs(updated);
      return updated;
    });
  };

  const handlePrepareForAnalysis = async () => {
    if (isPreparing) return;
    const sb = getSupabase();
    const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null;
    if (!token) {
      addLog('warn', '[ANALYSE] Connexion admin requise pour préparer les annonces.');
      return;
    }
    setIsPreparing(true);
    setIsTerminalExpanded(true);
    let done = 0;
    let files = 0;
    try {
      for (let round = 0; round < 60; round++) {
        const res = await fetch('/api/radar/fetch-docs?limit=2', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
        if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
        for (const p of data.processed || []) {
          done++;
          files += p.files || 0;
          addLog(
            p.errors?.length ? 'warn' : 'success',
            `[ANALYSE] « ${p.title} » : texte ${p.pageChars ?? 0} car., ${p.files} fichier(s) d’arrêté stocké(s)${p.errors?.length ? ` — ${p.errors.join(' ; ')}` : ''}.`
          );
        }
        setPrepareInfo(language === 'fr' ? `${done} annonce(s) préparée(s), ${data.remaining} restante(s)…` : `${done} إعلان، ${data.remaining} متبقية…`);
        if (!data.remaining || !(data.processed || []).length) break;
      }
      setPrepareInfo(
        language === 'fr'
          ? `✅ ${done} annonce(s) prête(s) pour l’analyse (${files} fichier(s) d’arrêté). Écrivez « go » à Claude pour l’analyse et la publication.`
          : `✅ ${done} إعلان جاهز للتحليل.`
      );
    } catch (err: any) {
      addLog('warn', `[ANALYSE] Préparation interrompue : ${err?.message || err}`);
      setPrepareInfo(language === 'fr' ? `Préparation interrompue après ${done} annonce(s) : ${err?.message || err}` : 'توقف التحضير.');
    } finally {
      setIsPreparing(false);
    }
  };

  const handleBackfillDetails = async () => {
    if (isBackfilling || isScanning) return;
    setIsBackfilling(true);
    setIsTerminalExpanded(true);
    setBackfillProgress(5);
    addLog('info', '[BACKFILL] Mise à jour des fiches : emploi-public.ma (officiel), puis dreamjob.ma pour compléter les champs manquants...');

    let offset = 0;
    const limit = 6;
    let hasMore = true;
    let totalUpdated = 0;
    let totalComplete = 0;
    let totalUnreachable = 0;

    try {
      let authHeaders: Record<string, string> = {};
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        if (token) authHeaders = { Authorization: `Bearer ${token}` };
      }

      if (!authHeaders.Authorization) {
        addLog('warn', '[BACKFILL] Connexion admin requise pour mettre à jour la base Supabase.');
        setIsBackfilling(false);
        return;
      }

      while (hasMore) {
        addLog('info', `[BACKFILL] Traitement du lot (offset: ${offset}, limit: ${limit})...`);
        const res = await fetch(`/api/radar/backfill-details?offset=${offset}&limit=${limit}`, {
          headers: authHeaders,
        });

        if (!res.ok) {
          throw new Error(`Erreur HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || 'Erreur inconnue');
        }

        if (Array.isArray(data.updated)) {
          data.updated.forEach((u: any) => {
            totalUpdated++;
            addLog('success', `[MIS À JOUR] « ${u.title} » (${u.fields.join(', ')}).`);
          });
        }
        if (Array.isArray(data.alreadyComplete)) {
          data.alreadyComplete.forEach((c: any) => {
            totalComplete++;
            addLog('info', `[DÉJÀ COMPLET] « ${c.title} ».`);
          });
        }
        if (Array.isArray(data.possibleDreamjob)) {
          data.possibleDreamjob.forEach((p: any) => {
            addLog('info', `[DREAMJOB À VÉRIFIER] « ${p.title} » ressemble à ${p.url}, mais l’annonce ne cite pas sa fiche officielle : rien n’a été écrit.`);
          });
        }
        if (offset === 0 && data.summary && data.summary.dreamjobCandidates === 0) {
          addLog('info', '[BACKFILL] Aucune annonce dreamjob en base : lancez d’abord un scan dreamjob.ma pour qu’il puisse compléter les fiches.');
        }
        if (Array.isArray(data.unreachable)) {
          data.unreachable.forEach((un: any) => {
            totalUnreachable++;
            addLog('warn', `[INJOIGNABLE] « ${un.title} » (${un.error}).`);
          });
        }

        const total = data.totalCount || 1;
        offset += limit;
        hasMore = data.hasMore === true && offset < total;
        setBackfillProgress(Math.min(95, Math.round((offset / total) * 100)));
      }

      setBackfillProgress(100);
      addLog(
        'success',
        `[BILAN BACKFILL] Terminé : ${totalUpdated} concours mis à jour, ${totalComplete} déjà complets, ${totalUnreachable} injoignables.`
      );
      setImportedToast(
        language === 'fr'
          ? `✅ Fiches mises à jour (emploi-public + dreamjob) : ${totalUpdated} actualisées, ${totalComplete} déjà complètes.`
          : `✅ تم تحديث بيانات المباريات من الموقع الرسمي بنجاح.`
      );
    } catch (err: any) {
      addLog('warn', `[BACKFILL] Erreur lors de la mise à jour : ${err?.message || err}`);
    } finally {
      setIsBackfilling(false);
      setTimeout(() => setImportedToast(null), 6000);
    }
  };

  const [isLiveRealScrape, setIsLiveRealScrape] = useState(true);

  const handleStartScan = async (targetSourceId?: string) => {
    if (isScanning) return;
    const src = sources.find((x) => x.id === (targetSourceId || scanSourceId)) || sources[0];
    setIsScanning(true);
    setScanningSourceId(src.id);
    setScanProgress(15);
    setIsTerminalExpanded(true);

    addLog('info', `[RADAR] Scan demandé par l’admin : ${src.domain}`, src.id);

    try {
      setScanProgress(35);

      // Jeton de l'admin connecté → autorise l'écriture en base (RLS staff).
      let authHeaders: Record<string, string> = {};
      const sb = getSupabase();
      if (sb) {
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        if (token) authHeaders = { Authorization: `Bearer ${token}` };
      }

      const response = await fetch(`/api/radar/scrape-live?source=${encodeURIComponent(src.scanKey)}`, {
        headers: authHeaders,
      });
      setScanProgress(70);

      if (!response.ok) {
        throw new Error(`Erreur serveur HTTP ${response.status}`);
      }

      const data = await response.json();
      setScanProgress(90);

      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((l: any) => addLog(l.level, l.message, src.id));
      }

      setScanStats(
        saveSourceScanStat(src.id, {
          at: new Date().toISOString(),
          found: data.count || 0,
          inserted: data.inserted || 0,
          persisted: !!data.persisted,
          robotsAllowed: data.robotsAllowed !== false,
        })
      );

      if (data.robotsAllowed === false) {
        setImportedToast(
          language === 'fr'
            ? `${src.domain} interdit ce scan (robots.txt) — rien n’a été récupéré.`
            : `${src.domain} يمنع هذا المسح (robots.txt).`
        );
      } else if (data.items && data.items.length > 0) {
        // Fusion avec les annonces déjà connues (statut conservé).
        const existing = loadScrapedItems();
        const existingMap = new Map(existing.map((e: any) => [e.id, e]));
        const normalizedLive = data.items.map(normalizeScrapedItem);
        const updatedLiveItems = normalizedLive.map((item: any) =>
          existingMap.has(item.id) ? { ...item, status: existingMap.get(item.id)?.status || item.status } : item
        );
        const merged = [
          ...updatedLiveItems,
          ...existing.filter((e: any) => !normalizedLive.some((d: any) => d.id === e.id)),
        ];
        saveScrapedItems(merged);
        setScrapedItems(merged);

        addLog('success', `[RADAR] ${data.items.length} annonces extraites de ${data.source} en ${data.executionTimeMs} ms.`, src.id);
        setImportedToast(
          language === 'fr'
            ? `${data.items.length} annonces récupérées de ${data.source}` +
                (data.persisted ? ` — ${data.inserted} nouvelle(s) en file de validation.` : '.')
            : `تم استخراج ${data.items.length} مباراة من ${data.source}`
        );
      } else {
        addLog('info', `[RADAR] Aucune annonce extraite de ${data.source || src.domain}. Voir le journal ci-dessus.`, src.id);
        setImportedToast(
          language === 'fr'
            ? `Aucune annonce extraite de ${src.domain} — consultez le journal.`
            : `لم يتم استخراج أي مباراة من ${src.domain}.`
        );
      }

      setScanProgress(100);
      setIsLiveRealScrape(true);
      // Après chaque scan : texte et fichiers des nouvelles annonces stockés pour l'analyse.
      if (data.persisted) setTimeout(() => handlePrepareForAnalysis(), 0);
    } catch (err: any) {
      addLog('warn', `[RADAR] Impossible de joindre le scraper (${err.message}).`, src.id);
      setScanProgress(100);
    } finally {
      setIsScanning(false);
      setScanningSourceId(null);
      setTimeout(() => setImportedToast(null), 5000);
    }
  };

  const handleImportToCatalog = async (item: ScrapedContestItem) => {
    // 1. Ajoute immédiatement au catalogue local pour affichage instantané
    const newContest = importScrapedContestToCatalog(item);
    setScrapedItems(loadScrapedItems());
    if (onContestImported) onContestImported(newContest);

    // 2. Tente la synchronisation / publication vers Supabase en arrière-plan
    let result: any = { ok: true };
    try {
      result = await publishScrapedToSupabase(item);
    } catch {
      result = { ok: false, reason: 'Synchronisation locale uniquement' };
    }

    addLog(
      result.ok ? 'success' : 'info',
      result.ok
        ? `[CATALOGUE] "${item.title.fr}" intégré et publié avec succès.`
        : `[CATALOGUE] "${item.title.fr}" intégré au catalogue (Note: ${result.reason || 'local'}).`,
      item.sourceId
    );

    setImportedToast(
      language === 'fr'
        ? `✅ Le concours "${item.title.fr}" a bien été ajouté au catalogue public !`
        : `✅ تمت إضافة المباراة بنجاح إلى دليل المباريات !`
    );
    setTimeout(() => setImportedToast(null), 5000);
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  // Publication groupée : intègre au catalogue et synchronise en ligne
  const publishBatch = async (items: ScrapedContestItem[], label: string) => {
    const importedList = importMultipleScrapedContestsToCatalog(items);
    setScrapedItems(loadScrapedItems());
    setSelectedIds([]);

    try {
      const { published, failures } = await publishManyScrapedToSupabase(items);
      addLog('success', `[${label}] ${published}/${items.length} synchronisés avec Supabase.`);
      failures.forEach((f) => addLog('info', `[${label}] « ${f.title} » : ${f.reason}.`));
    } catch {
      addLog('info', `[${label}] ${items.length} concours intégrés localement.`);
    }

    setImportedToast(
      language === 'fr'
        ? `✅ ${items.length} concours ont été ajoutés avec succès au catalogue public !`
        : `✅ تم نشر ${items.length} مباراة على الموقع !`
    );
    if (onContestImported && importedList.length > 0) {
      onContestImported(importedList[0]);
    }
    setTimeout(() => setImportedToast(null), 5000);
  };

  const handleBatchImport = async () => {
    if (selectedIds.length === 0) return;
    await publishBatch(scrapedItems.filter((i) => selectedIds.includes(i.id)), 'PUBLICATION');
  };

  const handleImportAllPending = async () => {
    const pendingItems = scrapedItems.filter((i) => i.status === 'pending_review');
    if (pendingItems.length === 0) return;
    await publishBatch(pendingItems, 'PUBLICATION MASSIVE');
  };

  const handleBatchIgnore = () => {
    if (selectedIds.length === 0) return;
    ignoreMultipleScrapedContests(selectedIds);
    setScrapedItems(loadScrapedItems());
    setSelectedIds([]);
    addLog('info', `[ACTION REGROUPÉE] ${selectedIds.length} concours ont été ignorés.`);
  };

  const handleDeleteImported = async (item: ScrapedContestItem) => {
    const contestId = item.id.replace(/^scrape-/, 'c-');
    if (onDeleteContest) {
      await onDeleteContest(contestId);
      await onDeleteContest(item.id);
    } else {
      await deleteContestFromSystem(contestId);
      await deleteContestFromSystem(item.id);
    }
    const existing = loadScrapedItems();
    const updated = existing.map((s) => (s.id === item.id ? { ...s, status: 'pending_review' as const } : s));
    saveScrapedItems(updated);
    setScrapedItems(updated);
    addLog('warn', `[SUPPRESSION] Le concours "${item.title?.[language] || item.title?.fr || item.id}" a été retiré du catalogue.`);
    setImportedToast(language === 'fr' ? 'Concours supprimé du catalogue.' : 'تم حذف المباراة من الدليل.');
    setTimeout(() => setImportedToast(null), 4000);
  };

  const handleExportScrapedJson = () => {
    const dataStr = JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        radarEngine: 'KounKour Radar Moroccan Civil Service Scraper v1.0',
        sourcesMonitored: sources,
        scrapedContests: scrapedItems,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kounkour_radar_scrapes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = scrapedItems.filter((item) => {
    if (selectedSourceFilter !== 'all' && item.sourceId !== selectedSourceFilter) return false;
    if (statusFilter === 'pending' && item.status !== 'pending_review') return false;
    if (statusFilter === 'imported' && item.status !== 'imported') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitleFr = (item.title?.fr || '').toLowerCase().includes(q);
      const inTitleAr = (item.title?.ar || '').toLowerCase().includes(q);
      const inAdminFr = (item.administration?.name?.fr || '').toLowerCase().includes(q);
      const inAdminAr = (item.administration?.name?.ar || '').toLowerCase().includes(q);
      const inSpecFr = (item.specialty?.fr || '').toLowerCase().includes(q);
      const inRef = (item.referenceCode || '').toLowerCase().includes(q);
      if (!inTitleFr && !inTitleAr && !inAdminFr && !inAdminAr && !inSpecFr && !inRef) {
        return false;
      }
    }
    return true;
  });

  const formatLastScan = (stat?: SourceScanStat) => {
    if (!stat) return language === 'fr' ? 'Jamais scanné sur cet appareil' : 'لم يتم المسح بعد';
    const mins = Math.max(0, Math.round((Date.now() - new Date(stat.at).getTime()) / 60000));
    const ago =
      mins < 1 ? 'à l’instant' : mins < 60 ? `il y a ${mins} min` : mins < 1440 ? `il y a ${Math.round(mins / 60)} h` : `il y a ${Math.round(mins / 1440)} j`;
    if (!stat.robotsAllowed) return `Scan ${ago} : bloqué par robots.txt`;
    return `Scan ${ago} : ${stat.found} annonce(s)` + (stat.persisted ? `, ${stat.inserted} nouvelle(s)` : '');
  };
  const scanSource = sources.find((x) => x.id === scanSourceId) || sources[0];

  const totalPending = scrapedItems.filter((i) => i.status === 'pending_review').length;
  const totalImported = scrapedItems.filter((i) => i.status === 'imported').length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Toast notification */}
      {importedToast && (
        <div className="fixed top-20 start-1/2 -translate-x-1/2 z-50 bg-[#8D174B] text-white px-5 py-3 rounded-2xl shadow-xl border border-white/20 text-xs sm:text-sm font-bold flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{importedToast}</span>
        </div>
      )}

      {/* Radar Main Header & Visual Sweep */}
      <div className="bg-gradient-to-br from-[#1C1420] via-[#2A1728] to-[#120F16] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-[#8D174B]/30">
        
        {/* Radar Circular Animation Background */}
        <div className="absolute top-1/2 end-10 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 opacity-20 pointer-events-none hidden md:block">
          <div className="relative w-full h-full rounded-full border border-emerald-500/40 flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-full border border-emerald-500/30 flex items-center justify-center">
              <div className="w-1/2 h-1/2 rounded-full border border-emerald-500/30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>
            {/* Sweep hand */}
            <div 
              className={`absolute top-0 start-1/2 w-1/2 h-1/2 origin-bottom-start bg-gradient-to-tr from-emerald-500/20 to-transparent ${
                isScanning ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '4s' }}
            />
          </div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{language === 'fr' ? 'Radar Réel Opérationnel' : 'رادار حقيقي شغال 100%'}</span>
            </span>

            <span className="text-xs text-emerald-300 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/50 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sources : {sources.map((x) => x.domain).join(' · ')}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            {language === 'fr' ? 'Radar des Concours Publics au Maroc' : 'رادار مباريات التوظيف العمومي بالمغرب'}
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
            {language === 'fr'
              ? 'Choisissez le site à scanner puis lancez le scan. Les annonces extraites sont nettoyées et placées en file de validation : rien n’est publié sans votre accord, et toujours avec la source officielle.'
              : 'اختر الموقع ثم شغّل المسح. توضع المباريات المستخرجة في قائمة التحقق ولا تنشر إلا بموافقتك ومع المصدر الرسمي.'}
          </p>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-300">
              <span>{language === 'fr' ? 'Site à scanner' : 'الموقع'}</span>
              <select
                value={scanSourceId}
                onChange={(e) => setScanSourceId(e.target.value)}
                disabled={isScanning}
                className="bg-black/40 border border-white/20 text-white text-xs sm:text-sm font-bold rounded-2xl px-3 py-3 focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                {sources.map((x) => (
                  <option key={x.id} value={x.id} className="text-[#242126]">
                    {x.domain}{x.category === 'aggregator' ? ' (agrégateur)' : ' (officiel)'}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => handleStartScan()}
              disabled={isScanning || isBackfilling}
              className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-lg transition-all cursor-pointer ${
                isScanning
                  ? 'bg-emerald-600/70 text-white cursor-wait'
                  : 'bg-gradient-to-r from-[#8D174B] to-[#C73578] hover:from-[#75123E] hover:to-[#B52568] text-white shadow-[#8D174B]/30'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>
                {isScanning
                  ? (language === 'fr' ? `Scan en cours (${scanProgress}%)...` : `جارٍ المسح (${scanProgress}%)...`)
                  : (language === 'fr' ? `Scanner ${scanSource.domain}` : `مسح ${scanSource.domain}`)}
              </span>
            </button>

            <button
              onClick={handleBackfillDetails}
              disabled={isScanning || isBackfilling}
              className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                isBackfilling
                  ? 'bg-purple-700/80 text-white cursor-wait'
                  : 'bg-white/15 hover:bg-white/20 text-white border border-white/25 hover:border-white/40'
              }`}
              title="Complète les concours déjà publiés depuis leur fiche officielle emploi-public, puis depuis dreamjob uniquement si l’annonce cite cette fiche. Aucune valeur existante n’est remplacée."
            >
              <Database className={`w-4 h-4 ${isBackfilling ? 'animate-spin' : 'text-purple-300'}`} />
              <span>
                {isBackfilling
                  ? (language === 'fr' ? `Mise à jour (${backfillProgress}%)...` : `جارٍ التحديث (${backfillProgress}%)...`)
                  : (language === 'fr' ? 'Mettre à jour les fiches (emploi-public + dreamjob)' : 'تحديث البيانات (emploi-public + dreamjob)')}
              </span>
            </button>

            <button
              onClick={handlePrepareForAnalysis}
              disabled={isScanning || isPreparing}
              className={`px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 ${
                isPreparing ? 'bg-amber-600/80 text-white cursor-wait' : 'bg-amber-400 hover:bg-amber-300 text-[#242126]'
              }`}
              title="Le serveur ouvre chaque nouvelle annonce et stocke son texte et les images / PDF de l’arrêté dans Supabase, pour l’analyse par Claude. Rien n’est publié."
            >
              <Download className={`w-4 h-4 ${isPreparing ? 'animate-bounce' : ''}`} />
              <span>
                {isPreparing
                  ? (language === 'fr' ? 'Préparation…' : 'جارٍ التحضير…')
                  : (language === 'fr' ? 'Préparer pour l’analyse (arrêtés)' : 'تحضير للتحليل')}
              </span>
            </button>
            {prepareInfo && <p className="w-full text-[11px] text-amber-200 font-semibold">{prepareInfo}</p>}

            <button
              onClick={handleExportScrapedJson}
              className="px-4 py-3 rounded-2xl font-semibold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'fr' ? 'Exporter les données scrapées (JSON)' : 'تصدير البيانات (JSON)'}</span>
            </button>

            <button
              onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
              className="px-4 py-3 rounded-2xl font-semibold text-xs bg-black/40 hover:bg-black/60 text-gray-300 border border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>{language === 'fr' ? 'Terminal Logs' : 'سجل العمليات'}</span>
              {isTerminalExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Progress bar when scanning or backfilling */}
          {(isScanning || isBackfilling) && (
            <div className="mt-4">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full shadow-sm ${
                    isBackfilling ? 'bg-purple-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${isBackfilling ? backfillProgress : scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 relative z-10">
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-white block">{sources.length}</span>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              {language === 'fr' ? 'Sources Surveillées' : 'المصادر المراقبة'}
            </span>
          </div>

          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 block">{scrapedItems.length}</span>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              {language === 'fr' ? 'Annonces Scrapées' : 'المباريات الملتقطة'}
            </span>
          </div>

          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-amber-400 block">{totalPending}</span>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              {language === 'fr' ? 'En attente d’import' : 'في انتظار الإدراج'}
            </span>
          </div>

          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-[#C73578] block">{totalImported}</span>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              {language === 'fr' ? 'Publiés via le Radar' : 'منشورة عبر الرادار'}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Crawler Log Panel (Collapsible) */}
      {isTerminalExpanded && (
        <div className="bg-[#0E0C10] border border-[#2D2633] rounded-3xl p-4 sm:p-5 shadow-xl text-xs font-mono text-gray-300">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-bold">KounKour Crawler Console (Real-Time Scraping Feed)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                LIVE
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLogs([])}
                className="text-gray-400 hover:text-white text-[11px] px-2 py-1 rounded bg-white/5 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setIsTerminalExpanded(false)}
                className="text-gray-400 hover:text-white text-[11px] px-2 py-1 rounded bg-white/5 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pe-2 font-mono text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                <span className={`shrink-0 font-bold ${
                  log.level === 'success' ? 'text-emerald-400' :
                  log.level === 'parser' ? 'text-purple-400' :
                  log.level === 'warn' ? 'text-amber-400' : 'text-blue-400'
                }`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-gray-200">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Official Sources Monitored */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#242126]">
              {language === 'fr' ? 'Sites à scanner' : 'المواقع القابلة للمسح'}
            </h2>
            <p className="text-xs text-[#6E6773]">
              {language === 'fr'
                ? 'Vous choisissez le site et déclenchez le scan vous-même.'
                : 'أنت من يختار الموقع ويشغّل المسح.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sources.map((src) => (
            <div
              key={src.id}
              className="bg-white border border-[#F1E5EC] hover:border-[#8D174B]/30 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{src.logo}</span>
                    <div>
                      <h3 className="text-xs font-bold text-[#242126] line-clamp-1">{src.name[language]}</h3>
                      <span className="text-[10px] text-gray-500 font-mono">{src.domain}</span>
                    </div>
                  </div>

                  {src.category === 'aggregator' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                      {language === 'fr' ? 'Agrégateur — non officiel' : 'غير رسمي'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      {language === 'fr' ? 'Source officielle' : 'مصدر رسمي'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#6E6773] line-clamp-2 mb-3">
                  {src.description[language]}
                </p>
              </div>

              <div className="pt-3 border-t border-[#F1E5EC] flex items-center justify-between text-xs">
                <span className="text-[10px] text-gray-500">
                  {formatLastScan(scanStats[src.id])}
                  {' · '}
                  {scrapedItems.filter((it) => it.sourceId === src.id).length} {language === 'fr' ? 'en liste' : 'بالقائمة'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setScanSourceId(src.id);
                      handleStartScan(src.id);
                    }}
                    disabled={isScanning}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#8D174B] bg-[#FDF2F7] hover:bg-[#F9E1EC] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-wait"
                    title={language === 'fr' ? 'Scanner ce site' : 'مسح هذا الموقع'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${scanningSourceId === src.id ? 'animate-spin' : ''}`} />
                    <span>{scanningSourceId === src.id ? (language === 'fr' ? 'Scan…' : 'جارٍ…') : (language === 'fr' ? 'Scanner' : 'مسح')}</span>
                  </button>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-gray-500 hover:text-[#8D174B] hover:bg-[#FDF2F7] transition-colors"
                    title="Visiter la source"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scraped Contests Feed */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#242126]">
                {language === 'fr' ? 'Annonces Détectées par le Radar' : 'المباريات الملتقطة عبر الرادار'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#FDF2F7] text-[#8D174B]">
                {filteredItems.length}
              </span>
            </div>
            <p className="text-xs text-[#6E6773]">
              {language === 'fr'
                ? 'Validez et intégrez les concours scrapés directement dans le catalogue public de votre application.'
                : 'قم بإدراج المباريات الجديدة مباشرة في الدليل العام للمنصة بضغطة زر.'}
            </p>
          </div>
        </div>

        {/* Filter Pills & Live Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => { setStatusFilter('pending'); setSelectedIds([]); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-[#8D174B] text-white shadow-xs'
                  : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:bg-[#FDF2F7]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Non encore ajoutés' : 'غير مضافة بالدليل'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-rose-50 text-[#8D174B] font-extrabold'
              }`}>
                {totalPending}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter('imported'); setSelectedIds([]); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'imported'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:bg-emerald-50'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Déjà au catalogue' : 'مضافة بالدليل'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'imported' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 font-extrabold'
              }`}>
                {totalImported}
              </span>
            </button>

            <button
              onClick={() => { setStatusFilter('all'); setSelectedIds([]); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-gray-800 text-white shadow-xs'
                  : 'bg-white text-[#6E6773] border border-[#F1E5EC] hover:bg-gray-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Tous les concours' : 'جميع المباريات'}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700 font-extrabold'
              }`}>
                {scrapedItems.length}
              </span>
            </button>
          </div>

          {/* Search box & Fast 1-click Mass Import */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSourceFilter}
              onChange={(e) => { setSelectedSourceFilter(e.target.value); setSelectedIds([]); }}
              className="text-xs bg-white border border-[#F1E5EC] focus:border-[#8D174B] rounded-xl px-2.5 py-1.5 text-[#242126] focus:outline-none shadow-2xs cursor-pointer"
              title={language === 'fr' ? 'Filtrer par site' : 'تصفية حسب الموقع'}
            >
              <option value="all">{language === 'fr' ? 'Tous les sites' : 'كل المواقع'}</option>
              {sources.map((x) => (
                <option key={x.id} value={x.id}>{x.domain}</option>
              ))}
            </select>
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher un concours...' : 'بحث سريع...'}
                className="w-full text-xs bg-white border border-[#F1E5EC] focus:border-[#8D174B] rounded-xl ps-9 pe-3 py-1.5 text-[#242126] focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {totalPending > 0 && statusFilter !== 'imported' && (
              <button
                onClick={handleImportAllPending}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#8D174B] to-[#75123E] hover:from-[#75123E] hover:to-[#5E0E32] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer transition-all shrink-0"
                title={language === 'fr' ? 'Importer tous les concours non encore ajoutés' : 'إدراج جميع المباريات المعلقة'}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? `Tout importer (${totalPending})` : `إدراج الكل (${totalPending})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Grouped Actions Toolbar */}
        <div className="bg-[#FAF7F9] border border-[#F1E5EC] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-[#242126] hover:text-[#8D174B] cursor-pointer"
            >
              {selectedIds.length === filteredItems.length && filteredItems.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#8D174B]" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
              <span>
                {selectedIds.length === filteredItems.length && filteredItems.length > 0
                  ? (language === 'fr' ? 'Tout désélectionner' : 'إلغاء تحديد الكل')
                  : (language === 'fr' ? `Tout sélectionner (${filteredItems.length})` : `تحديد الكل (${filteredItems.length})`)}
              </span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-xs font-extrabold text-[#8D174B] bg-[#FDF2F7] border border-[#8D174B]/20 px-2.5 py-0.5 rounded-full">
                {selectedIds.length} {language === 'fr' ? 'sélectionné(s)' : 'محدد'}
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchImport}
                className="px-3.5 py-1.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? `Importer la sélection (${selectedIds.length})` : `إدراج المحدد (${selectedIds.length})`}</span>
              </button>

              <button
                onClick={handleBatchIgnore}
                className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-rose-600 hover:border-rose-200 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>{language === 'fr' ? 'Ignorer' : 'تجاهل'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-[#F1E5EC] p-6 shadow-xs">
              <Database className="w-12 h-12 text-[#6E6773]/40 mx-auto mb-3" />
              <h4 className="text-base font-bold text-[#242126] mb-1">
                {language === 'fr' ? 'Aucun concours détecté avec ces filtres' : 'لا توجد نتائج مطابقة'}
              </h4>
              <p className="text-xs text-[#6E6773] max-w-sm mx-auto mb-4">
                {language === 'fr' 
                  ? `Choisissez un site puis lancez le scan (site sélectionné : ${scanSource.domain}).` 
                  : 'اضغط على زر تشغيل الرادار لبدء فحص جديد.'}
              </p>
              <button
                onClick={() => handleStartScan()}
                className="px-4 py-2 rounded-xl bg-[#8D174B] text-white text-xs font-bold shadow-xs hover:bg-[#75123E] cursor-pointer"
              >
                {language === 'fr' ? `Scanner ${scanSource.domain}` : `مسح ${scanSource.domain}`}
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleSelectItem(item.id)}
                  className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#8D174B] ring-2 ring-[#8D174B]/20 bg-[#FDF9FB]'
                      : item.status === 'imported'
                      ? 'border-emerald-200 bg-[#FAFDFA]'
                      : 'border-[#F1E5EC] hover:border-[#8D174B]/30'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left Column: Metadata & Selection */}
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectItem(item.id);
                        }}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer self-start sm:self-center shrink-0 mt-0.5"
                        title={isSelected ? 'Désélectionner' : 'Sélectionner'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#8D174B]" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300 hover:text-[#8D174B]" />
                        )}
                      </button>

                      <div className="flex-1 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                            <img
                              src={resolveAdministrationLogo(item.administration?.name?.fr || item.administration?.name?.[language], item.administration?.category, item.title?.fr || item.title?.[language])}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-xs font-bold text-[#8D174B] uppercase tracking-wide">
                            {item.administration?.name?.[language] || item.administration?.name?.fr || 'Administration'}
                          </span>

                          <span className="text-gray-300">•</span>

                          <span className="text-[11px] text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {item.referenceCode || (language === 'fr' ? 'Réf. à vérifier' : 'المرجع غير مؤكد')}
                          </span>

                          <span className="text-gray-300">•</span>

                          <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                            {item.parsingConfidence}% {language === 'fr' ? 'champs extraits' : 'حقول مستخرجة'}
                          </span>

                          {item.sourceId === 'src-dreamjob' && (
                            <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                              {language === 'fr' ? 'Via dreamjob — source officielle à confirmer' : 'عبر dreamjob — المصدر الرسمي للتأكيد'}
                            </span>
                          )}

                          {item.status === 'imported' && (
                            <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{language === 'fr' ? 'Actif au catalogue' : 'مضاف بالدليل'}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-[#242126] leading-snug">
                          {item.title?.[language] || item.title?.fr || ''}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#6E6773]">
                          <span>
                            <strong className="text-[#242126]">{item.postsCount || 1}</strong> {language === 'fr' ? 'postes ouverts' : 'منصب'}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>{language === 'fr' ? 'Diplôme :' : 'الدبلوم :'}</strong> {item.degreeLevel || (language === 'fr' ? 'à vérifier' : 'غير مؤكد')}
                          </span>
                          <span>•</span>
                          <span className="text-[#8D174B] font-semibold">
                            <strong>{language === 'fr' ? 'Dernier délai :' : 'آخر أجل :'}</strong> {item.deadlineDate || (language === 'fr' ? 'à vérifier' : 'غير مؤكد')}{item.daysRemaining > 0 ? ` (${item.daysRemaining} ${language === 'fr' ? 'jours restants' : 'يوم متبقي'})` : ''}
                          </span>
                        </div>

                        {item.possibleDuplicate && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                            <strong>{language === 'fr' ? 'Doublon possible' : 'تكرار محتمل'}</strong>
                            {' — '}
                            {item.possibleDuplicate.kind === 'publie'
                              ? (language === 'fr' ? 'déjà sur le site : ' : 'موجود بالموقع : ')
                              : (language === 'fr' ? 'déjà détecté sur emploi-public : ' : 'مرصود في emploi-public : ')}
                            {item.possibleDuplicate.url ? (
                              <a
                                href={item.possibleDuplicate.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="underline font-semibold"
                              >
                                {item.possibleDuplicate.title}
                              </a>
                            ) : (
                              <span className="font-semibold">{item.possibleDuplicate.title}</span>
                            )}
                            {language === 'fr' ? '. Vérifiez avant de publier.' : ''}
                          </div>
                        )}

                        {/* Raw Snippet Box */}
                        <div className="p-3 bg-[#FAF7F9] border border-[#F1E5EC] rounded-xl text-xs text-[#6E6773] italic">
                          <p className="line-clamp-2">
                            "{item.rawSnippet?.[language] || item.rawSnippet?.fr || (typeof item.rawSnippet === 'string' ? item.rawSnippet : item.title?.[language] || '')}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#F1E5EC]">
                      {item.status !== 'imported' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImportToCatalog(item);
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#8D174B] hover:bg-[#75123E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>{language === 'fr' ? 'Intégrer au catalogue' : 'إدراج بالموقع'}</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="text-end text-xs text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{language === 'fr' ? 'Disponible dans l’app' : 'متوفر بالتطبيق'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImported(item);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title={language === 'fr' ? 'Supprimer ce concours du catalogue' : 'حذف المباراة من الدليل'}
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>{language === 'fr' ? 'Supprimer' : 'حذف'}</span>
                          </button>
                        </div>
                      )}

                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-[#6E6773] hover:text-[#8D174B] hover:bg-gray-100 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{language === 'fr' ? 'Source' : 'المصدر'} ({item.sourceName})</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
