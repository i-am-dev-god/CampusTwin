import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Code2,
  Command,
  ContactRound,
  Copy,
  Cpu,
  GraduationCap,
  Heart,
  HeartHandshake,
  HeartPulse,
  LayoutDashboard,
  Leaf,
  LifeBuoy,
  Lightbulb,
  Laptop,
  Mail,
  Megaphone,
  Menu,
  MessageSquareText,
  Music2,
  Palette,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  Utensils,
  X,
} from 'lucide-react';
import { announcements, classDeadlines, clubs, directory, events, initialClassUpdates, pageLabels } from './data.js';

const iconMap = {
  Activity,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  Code2,
  ContactRound,
  Cpu,
  GraduationCap,
  Heart,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Laptop,
  Lightbulb,
  Megaphone,
  Music2,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
};

const navSections = [
  {
    label: 'STUDENT PORTAL',
    items: [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'CAMPUS LIFE',
    items: [
      { id: 'events', label: 'Events', icon: CalendarDays },
      { id: 'clubs', label: 'Clubs & student groups', icon: UsersRound },
    ],
  },
  {
    label: 'MY CLASS',
    items: [{ id: 'class', label: 'My class', icon: BookOpen }],
  },
  {
    label: 'INFORMATION',
    items: [
      { id: 'directory', label: 'Campus directory', icon: ContactRound },
      { id: 'announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
];

function useStoredSet(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return new Set(saved ? JSON.parse(saved) : fallback);
    } catch {
      return new Set(fallback);
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify([...value]));
    } catch {
      // The dashboard still works if local storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue];
}

function useStoredList(key, fallback = []) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : fallback;
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The portal still works if local storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue];
}

function useStoredValue(key, fallback, validValues) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return validValues.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // The selected mode still works if local storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue];
}

function toDateTimeInputValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getDayOffsetForDate(date) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(12, 0, 0, 0);
  return Math.round((eventDate.getTime() - today.getTime()) / 86400000);
}

function formatDuration(start, end) {
  const totalMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours} hour${hours === 1 ? '' : 's'}` : '', minutes ? `${minutes} minutes` : ''].filter(Boolean).join(' ');
}

function getDateParts(offset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return {
    day: date.toLocaleDateString('en-US', { day: '2-digit' }),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    full: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
  };
}

function getEventDayLabel(offset) {
  if (offset === 0) return 'TODAY';
  if (offset === 1) return 'TOMORROW';
  return getDateParts(offset).weekday;
}

function getDeadlineDueLabel(offset) {
  if (offset < 0) return offset === -1 ? '1 DAY OVERDUE' : `${Math.abs(offset)} DAYS OVERDUE`;
  if (offset === 0) return 'DUE TODAY';
  if (offset === 1) return 'DUE TOMORROW';
  return `DUE IN ${offset} DAYS`;
}

function getEventStartTimestamp(event) {
  if (event.startsAt && Number.isFinite(Date.parse(event.startsAt))) return Date.parse(event.startsAt);
  const date = new Date();
  date.setDate(date.getDate() + event.dayOffset);
  date.setHours(12, 0, 0, 0);
  const time = event.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (time) {
    const hour = (Number(time[1]) % 12) + (time[3].toUpperCase() === 'PM' ? 12 : 0);
    date.setHours(hour, Number(time[2]), 0, 0);
  }
  return date.getTime();
}

function getCardRect(element) {
  if (!element?.getBoundingClientRect) return undefined;
  const { left, top, width, height } = element.getBoundingClientRect();
  const borderRadius = window.getComputedStyle?.(element).borderRadius;
  return { element, left, top, width, height, borderRadius };
}

function openCardFromSurface(event, onOpen) {
  if (event.currentTarget.classList.contains('origin-card-expanded')) return;
  if (event.target.closest?.('button, a, input, select, textarea, [data-card-action]')) return;
  onOpen(getCardRect(event.currentTarget));
}

function openCardFromControl(event, onOpen) {
  const card = event.currentTarget.closest('.clickable-card');
  if (!card || card.classList.contains('origin-card-expanded')) return;
  onOpen(getCardRect(card));
}

function Icon({ name, size = 18, strokeWidth = 1.8, ...props }) {
  const LucideIcon = iconMap[name] || Sparkles;
  return <LucideIcon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} />;
}

function BrandMark({ small = false }) {
  return (
    <span className={`brand-mark${small ? ' brand-mark-small' : ''}`} aria-hidden="true">
      <span className="brand-mark-core" />
      <span className="brand-mark-orbit" />
    </span>
  );
}

function SidebarPlan({ event, joinedClubs, registeredCount, navigate, onOpenEvent, onOpenClub }) {
  const firstJoinedClub = joinedClubs[0];
  const planItemCount = registeredCount + joinedClubs.length;

  return (
    <section className="sidebar-plan" aria-label="Your campus plan">
      <div className="sidebar-plan-heading">
        <span className="sidebar-plan-icon"><CalendarDays size={15} /></span>
        <span className="sidebar-plan-heading-copy"><small>YOUR CAMPUS</small><strong>My plan</strong></span>
        {planItemCount > 0 && <span className="sidebar-plan-count" aria-label={`${planItemCount} items in your plan`}>{planItemCount}</span>}
      </div>
      {event ? (
        <button className="sidebar-plan-item" onClick={() => onOpenEvent(event)} aria-label={`Open your RSVP: ${event.title}`}>
          <small className="sidebar-plan-kicker">YOUR NEXT RSVP · {getEventDayLabel(event.dayOffset)}</small>
          <strong>{event.title}</strong>
          <span>{event.time} · {event.venue}</span>
        </button>
      ) : (
        <button className="sidebar-plan-empty" onClick={() => navigate('events')}>
          <span className="sidebar-plan-empty-icon"><CalendarDays size={14} /></span>
          <span className="sidebar-plan-empty-copy"><strong>No events on your plan</strong><small>Explore events and RSVP to save one</small></span>
          <ArrowRight size={14} />
        </button>
      )}
      {firstJoinedClub ? (
        <button className="sidebar-plan-item sidebar-plan-community" onClick={() => onOpenClub(firstJoinedClub)} aria-label={`Open ${firstJoinedClub.name}, one of ${joinedClubs.length} joined groups`}>
          <small className="sidebar-plan-kicker">{joinedClubs.length > 1 ? `${joinedClubs.length} GROUPS JOINED` : 'YOUR COMMUNITY'}</small>
          <strong>{firstJoinedClub.name}</strong>
          <span>{firstJoinedClub.next}</span>
        </button>
      ) : (
        <button className="sidebar-plan-empty" onClick={() => navigate('clubs')}>
          <span className="sidebar-plan-empty-icon"><UsersRound size={14} /></span>
          <span className="sidebar-plan-empty-copy"><strong>No groups joined yet</strong><small>Find a community that fits you</small></span>
          <ArrowRight size={14} />
        </button>
      )}
    </section>
  );
}

function Sidebar({ activePage, navigate, unreadCount, unreadClassUpdateCount, isOpen, onClose, onFeedback, eventList, registeredEvents, clubsJoined, roleMode, onRoleChange, onOpenEvent, onOpenClub }) {
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const roleSwitcherRef = useRef(null);
  const CurrentRoleIcon = roleMode === 'class-representative' ? ShieldCheck : GraduationCap;
  const now = Date.now();

  useEffect(() => {
    if (!isRoleMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target)) setIsRoleMenuOpen(false);
    };
    const handleKeyDown = (event) => { if (event.key === 'Escape') setIsRoleMenuOpen(false); };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRoleMenuOpen]);
  const plannedEvents = eventList.filter((event) => {
    if (!registeredEvents.has(event.id)) return false;
    const endTime = Date.parse(event.endsAt || '');
    return Number.isFinite(endTime) ? endTime > now : getEventStartTimestamp(event) >= now;
  });
  const joinedClubList = clubs.filter((club) => clubsJoined.has(club.id));

  return (
    <>
      <button className={`sidebar-scrim${isOpen ? ' sidebar-scrim-open' : ''}`} aria-label="Close navigation" onClick={onClose} disabled={!isOpen} tabIndex={isOpen ? 0 : -1} aria-hidden={!isOpen} />
      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <div className="brand-lockup">
            <BrandMark />
            <span className="brand-wordmark">campus<span>twin</span></span>
          </div>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>

        <div className="role-switcher-wrap" ref={roleSwitcherRef}>
          <button className="campus-switcher" type="button" onClick={() => setIsRoleMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={isRoleMenuOpen} aria-controls="role-mode-menu">
            <span className="campus-switcher-icon"><CurrentRoleIcon size={17} /></span>
            <span className="campus-switcher-copy"><small>VIEW AS · DEMO MODE</small><strong>{roleMode === 'class-representative' ? 'Class representative' : 'Student'}</strong></span>
            <ChevronDown size={15} className={`campus-switcher-chevron${isRoleMenuOpen ? ' role-menu-chevron-open' : ''}`} />
          </button>
          {isRoleMenuOpen && (
            <div className="role-menu" id="role-mode-menu" role="menu" aria-label="Switch demo role">
              <p className="role-menu-label">SWITCH DEMO ROLE</p>
              <button className={`role-menu-option${roleMode === 'student' ? ' role-menu-option-active' : ''}`} role="menuitemradio" aria-checked={roleMode === 'student'} onClick={() => { onRoleChange('student'); setIsRoleMenuOpen(false); onClose(); }}>
                <span className="role-menu-option-icon"><GraduationCap size={16} /></span>
                <span className="role-menu-option-copy"><strong>Student</strong><small>Class schedule and personal tasks</small></span>
                {roleMode === 'student' && <Check size={15} className="role-menu-option-check" />}
              </button>
              <button className={`role-menu-option${roleMode === 'class-representative' ? ' role-menu-option-active' : ''}`} role="menuitemradio" aria-checked={roleMode === 'class-representative'} onClick={() => { onRoleChange('class-representative'); setIsRoleMenuOpen(false); onClose(); }}>
                <span className="role-menu-option-icon"><ShieldCheck size={16} /></span>
                <span className="role-menu-option-copy"><strong>Class representative</strong><small>Post and manage class updates</small></span>
                {roleMode === 'class-representative' && <Check size={15} className="role-menu-option-check" />}
              </button>
              <p className="role-menu-note">Preview role only · no login or access rules yet.</p>
            </div>
          )}
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <p className="nav-section-label">{section.label}</p>
              {section.items.map(({ id, label, icon: NavIcon }) => (
                <button
                  key={id}
                  className={`nav-link${activePage === id ? ' nav-link-active' : ''}`}
                  onClick={() => navigate(id)}
                  aria-current={activePage === id ? 'page' : undefined}
                >
                  <NavIcon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                  {id === 'announcements' && unreadCount > 0 && <span className="nav-count">{unreadCount}</span>}
                  {id === 'class' && unreadClassUpdateCount > 0 && <span className="nav-count nav-count-class" aria-label={`${unreadClassUpdateCount} new class updates`}>{unreadClassUpdateCount}</span>}
                  {activePage === id && <span className="nav-active-mark" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <SidebarPlan
            event={plannedEvents[0]}
            joinedClubs={joinedClubList}
            registeredCount={plannedEvents.length}
            navigate={navigate}
            onOpenEvent={(event) => { onClose(); onOpenEvent(event); }}
            onOpenClub={(club) => { onClose(); onOpenClub(club); }}
          />
          <button className="sidebar-help" onClick={() => { onClose(); onFeedback(); }}>
            <LifeBuoy size={17} />
            <span>Feedback</span>
            <ArrowUpRight size={14} className="help-arrow" />
          </button>
          <div className="sidebar-user">
            <div className="avatar avatar-sidebar">AR</div>
            <div className="sidebar-user-copy"><strong>Aanya Rao</strong><small>Student · Year 2</small></div>
            <span className="user-menu-button" aria-hidden="true"><ChevronDown size={15} /></span>
          </div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ activePage, roleMode, unreadCount, onNotifications, isNotificationsOpen, onMobileMenu, searchValue, setSearchValue, searchOpen, setSearchOpen, searchResults, onSearchResult, searchRef }) {
  const inputRef = useRef(null);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [setSearchOpen]);

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button className="icon-button mobile-menu-button" onClick={onMobileMenu} aria-label="Open navigation"><Menu size={20} /></button>
        <BrandMark small />
        <div className="topbar-page-label"><span>{roleMode === 'class-representative' ? 'CLASS REP MODE' : 'STUDENT PORTAL'}</span><strong>{pageLabels[activePage] || 'Dashboard'}</strong></div>
      </div>

      <div className="topbar-search-wrap" ref={searchRef}>
        <div className={`topbar-search${searchOpen ? ' topbar-search-focused' : ''}`}>
          <Search size={17} />
          <input
            ref={inputRef}
            type="search"
            value={searchValue}
            placeholder="Search events, services, notices..."
            aria-label="Search campus"
            onChange={(event) => { setSearchValue(event.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && searchResults.length) {
                event.preventDefault();
                onSearchResult(searchResults[0]);
              }
            }}
          />
          {!searchValue && <kbd><Command size={11} /> K</kbd>}
          {searchValue && <button className="search-clear" onClick={() => { setSearchValue(''); setSearchOpen(false); }} aria-label="Clear search"><X size={15} /></button>}
        </div>
        {searchOpen && searchValue.trim() && (
          <div className="search-results-popover">
            <div className="popover-eyebrow">CAMPUS SEARCH <span>{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}</span></div>
            {searchResults.length ? searchResults.map((result) => (
              <button className="search-result" key={`${result.type}-${result.id}`} onClick={() => onSearchResult(result)}>
                <span className={`search-result-icon tone-${result.color || 'cyan'}`}><Icon name={result.icon || 'Sparkles'} size={16} /></span>
                <span className="search-result-copy"><strong>{result.title}</strong><small>{result.typeLabel}</small></span>
                <ArrowUpRight size={14} />
              </button>
            )) : <div className="search-empty">No results found. Search events, groups, services, or notices.</div>}
            <div className="search-footer">Search results use sample campus data.</div>
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <div className="notification-wrap">
          <button className={`icon-button notification-button${isNotificationsOpen ? ' icon-button-selected' : ''}`} onClick={onNotifications} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>
        </div>
        <span className="avatar avatar-topbar" title="Demo student profile" aria-label="Aanya Rao">AR</span>
      </div>
    </header>
  );
}

function NotificationPanel({ unreadCount, unreadClassUpdates, readAnnouncements, onOpenNotice, onOpenClass, onAllRead }) {
  const totalUnread = unreadCount + unreadClassUpdates.length;
  return (
    <div className="notification-popover notification-popover-content">
      <div className="notification-popover-head">
        <div><strong>Updates</strong><span>{totalUnread ? `${totalUnread} unread` : 'You’re all caught up'}</span></div>
        {totalUnread > 0 && <button onClick={onAllRead}>Mark all read</button>}
      </div>
      <div className="notification-list">
        {unreadClassUpdates.length > 0 && <p className="notification-group-label">YOUR CLASS REP · NEW</p>}
        {unreadClassUpdates.slice(0, 3).map((item) => (
          <button key={item.id} className="notification-row notification-row-class notification-unread" onClick={onOpenClass}>
            <span className={`notice-icon tone-${item.color || 'lime'}`}><Icon name={item.icon || 'Megaphone'} size={15} /></span>
            <span className="notification-row-copy"><strong>{item.title}</strong><small>Class update · {item.time}</small></span>
            <span className="notification-unread-dot" />
          </button>
        ))}
        <p className="notification-group-label">CAMPUS NOTICES</p>
        {announcements.slice(0, 3).map((item) => (
          <button key={item.id} className={`notification-row${!readAnnouncements.has(item.id) ? ' notification-unread' : ''}`} onClick={() => onOpenNotice(item)}>
            <span className={`notice-icon tone-${item.color}`}><Icon name={item.icon} size={15} /></span>
            <span className="notification-row-copy"><strong>{item.title}</strong><small>{item.time}</small></span>
            {!readAnnouncements.has(item.id) && <span className="notification-unread-dot" />}
          </button>
        ))}
      </div>
      <button className="notification-see-all" onClick={() => onOpenNotice(null)}>View all announcements <ArrowRight size={14} /></button>
    </div>
  );
}

function OverviewPage({ navigate, onOpenEvent, onOpenNotice, registeredEvents, readAnnouncements, eventList, unreadClassUpdates }) {
  const date = getDateParts(0);
  const unreadCount = announcements.filter((item) => !readAnnouncements.has(item.id)).length;
  const shortcuts = [
    { title: 'Events', fullTitle: 'Events & RSVP', detail: 'Find events', icon: 'CalendarDays', tone: 'quick-cyan', page: 'events' },
    { title: 'Clubs', fullTitle: 'Clubs & communities', detail: 'Explore clubs', icon: 'UsersRound', tone: 'quick-violet', page: 'clubs' },
    { title: 'Directory', fullTitle: 'People & services', detail: 'People & services', icon: 'ContactRound', tone: 'quick-lime', page: 'directory' },
    { title: 'Notices', fullTitle: 'Announcements', detail: 'Campus updates', icon: 'Megaphone', tone: 'quick-pink', page: 'announcements' },
  ];

  return (
    <div className="page-stack overview-page">
      <div className="page-intro overview-intro">
        <div>
          <div className="eyebrow"><span className="eyebrow-live-dot" />{date.full.toUpperCase()} <span className="eyebrow-divider">/</span> CAMPUS DASHBOARD</div>
          <h1>Welcome back, Aanya</h1>
        </div>
      </div>

      {unreadClassUpdates.length > 0 && (
        <section className="class-update-alert" role="status" aria-live="polite" aria-label={`${unreadClassUpdates.length} new class updates`}>
          <span className="class-update-alert-icon"><Bell size={19} /></span>
          <div className="class-update-alert-copy">
            <small>{unreadClassUpdates.length === 1 ? 'FROM YOUR CLASS REP' : `${unreadClassUpdates.length} NEW FROM YOUR CLASS REP`}</small>
            <strong>{unreadClassUpdates[0].title}</strong>
            <p>{unreadClassUpdates[0].body}</p>
            <span>From {unreadClassUpdates[0].author} · {unreadClassUpdates[0].time}</span>
          </div>
          <button className="class-update-alert-action" onClick={() => navigate('class')}>Read updates <ArrowRight size={15} /></button>
        </section>
      )}

      <section className="dashboard-shortcut-section" aria-label="Quick access shortcuts">
        <div className="section-heading shortcuts-heading">
          <div><p className="section-overline">PORTAL SHORTCUTS</p><h2>Quick access</h2></div>
          <span className="shortcuts-pinned"><Star size={13} /> Pinned shortcuts</span>
        </div>
        <div className="quick-actions dashboard-shortcuts">
          {shortcuts.map((shortcut) => (
            <button className="quick-action" key={shortcut.page} aria-label={`${shortcut.fullTitle}: ${shortcut.detail}`} onClick={() => navigate(shortcut.page)}>
              <span className={`quick-action-icon ${shortcut.tone}`}><Icon name={shortcut.icon} size={18} /></span>
              <span><strong>{shortcut.title}</strong><small>{shortcut.detail}</small></span>
              <ArrowUpRight size={16} className="quick-arrow" />
            </button>
          ))}
        </div>
      </section>

      <div className="content-grid overview-content-grid">
        <section className="surface-card upcoming-panel">
          <div className="section-heading">
            <div><p className="section-overline">CAMPUS CALENDAR</p><h2>Upcoming events <span className="heading-count">{String(Math.min(eventList.length, 3)).padStart(2, '0')}</span></h2></div>
            <button className="text-button" onClick={() => navigate('events')}>View all <ArrowRight size={15} /></button>
          </div>
          <div className="upcoming-list">
            {eventList.slice(0, 3).map((item) => <UpcomingEvent key={item.id} event={item} onClick={(origin) => onOpenEvent(item, origin)} registered={registeredEvents.has(item.id)} />)}
          </div>
          <button className="panel-footer-link" onClick={() => navigate('events')}>View all events <ArrowRight size={15} /></button>
        </section>

        <section className="surface-card bulletin-panel">
          <div className="section-heading">
            <div><p className="section-overline">OFFICIAL ANNOUNCEMENTS</p><h2>Announcements {unreadCount > 0 && <span className="new-indicator">{unreadCount} UNREAD</span>}</h2></div>
            <button className="icon-button subtle-icon-button" onClick={() => navigate('announcements')} aria-label="View all announcements"><ArrowUpRight size={16} /></button>
          </div>
          <div className="bulletin-list">
            {announcements.slice(0, 3).map((item) => <BulletinItem key={item.id} item={item} onClick={(origin) => onOpenNotice(item, origin)} />)}
          </div>
          <button className="panel-footer-link" onClick={() => navigate('announcements')}>View all announcements <ArrowRight size={15} /></button>
        </section>
      </div>

      <footer className="content-footer"><span>CampusTwin <i>·</i> Student portal</span><span>Preview with sample campus content</span></footer>
    </div>
  );
}

function UpcomingEvent({ event, onClick, registered }) {
  const date = getDateParts(event.dayOffset);
  return (
    <article className="upcoming-event clickable-card" onClick={(clickEvent) => openCardFromSurface(clickEvent, onClick)}>
      <div className={`date-tile tone-${event.color}`}><span>{date.month}</span><strong>{date.day}</strong><small>{getEventDayLabel(event.dayOffset)}</small></div>
      <div className="upcoming-event-copy">
        <div className="event-meta-line"><span className={`event-category-dot dot-${event.color}`} />{event.category}<span className="meta-divider">·</span>{event.time}</div>
        <button className="upcoming-event-title" onClick={(clickEvent) => openCardFromControl(clickEvent, onClick)}>{event.title}</button>
        <div className="upcoming-event-venue"><Building2 size={13} /> {event.venue}</div>
      </div>
      {registered && <span className="registered-mini" title="You’re registered"><Check size={13} /></span>}
      <button className="upcoming-event-open" onClick={(clickEvent) => openCardFromControl(clickEvent, onClick)} aria-label={`View ${event.title}`}><ChevronRight size={17} /></button>
    </article>
  );
}

function BulletinItem({ item, onClick }) {
  const open = (event) => {
    if (event.currentTarget.classList.contains('origin-card-expanded')) return;
    onClick(getCardRect(event.currentTarget));
  };
  return (
    <article className="bulletin-item clickable-card" role="button" tabIndex={0} onClick={open} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(event); } }}>
      <span className={`bulletin-symbol tone-${item.color}`}><Icon name={item.icon} size={16} /></span>
      <span className="bulletin-copy"><span className="bulletin-meta">{item.category}<i />{item.time.split('·')[0].trim()}</span><strong>{item.title}</strong><small>{item.author}</small></span>
      <ArrowUpRight size={15} className="bulletin-arrow" />
    </article>
  );
}

function EventsPage({ onOpenEvent, registeredEvents, eventList }) {
  const [activeFilter, setActiveFilter] = useState('All events');
  const [eventView, setEventView] = useState('all');
  const [expandedGroup, setExpandedGroup] = useState('');
  const filters = ['All events', 'Workshops', 'Talks', 'Hackathons', 'Culture & community', 'Club events'];
  const filteredEvents = eventList.filter((event) => {
    if (activeFilter === 'All events') return true;
    if (activeFilter === 'Culture & community') return ['culture', 'community'].includes(event.category.toLowerCase());
    if (activeFilter === 'Club events') return event.category.toLowerCase() === 'club event';
    return event.category.toLowerCase() === activeFilter.replace(/s$/, '').toLowerCase();
  });
  const weekEvents = eventList.filter((event) => event.dayOffset < 7);
  const nextEvent = eventList[0];
  const groups = [...new Set(eventList.map((event) => event.host))].map((name) => ({
    name,
    events: eventList.filter((event) => event.host === name),
  }));
  const visibleCount = eventView === 'all' ? filteredEvents.length : eventList.length;

  return (
    <div className="page-stack">
      <PageIntro eyebrow="STUDENT PORTAL / EVENTS" title="Events & activities" />

      <section className="events-glance" aria-labelledby="events-glance-title">
        <div className="events-glance-heading">
          <div><p className="section-overline">QUICK SUMMARY</p><h2 id="events-glance-title">At a glance</h2></div>
          <span className="events-glance-period">UPCOMING THIS WEEK</span>
        </div>
        <div className="events-glance-grid">
          <article className="events-glance-item">
            <span className="events-glance-icon tone-lime"><CalendarDays size={17} /></span>
            <span className="events-glance-copy"><small>THIS WEEK</small><strong>{weekEvents.length} events</strong></span>
          </article>
          <article className="events-glance-item events-glance-next clickable-card" role="button" tabIndex={0} onClick={(clickEvent) => openCardFromSurface(clickEvent, (origin) => onOpenEvent(nextEvent, origin))} onKeyDown={(keyEvent) => { if ((keyEvent.key === 'Enter' || keyEvent.key === ' ') && !keyEvent.currentTarget.classList.contains('origin-card-expanded')) { keyEvent.preventDefault(); onOpenEvent(nextEvent, getCardRect(keyEvent.currentTarget)); } }} aria-label={`View details for ${nextEvent.title}`}>
            <span className="events-glance-icon tone-cyan"><Activity size={17} /></span>
            <span className="events-glance-copy"><small>NEXT UP · {getEventDayLabel(nextEvent.dayOffset)} · {nextEvent.time}</small><strong>{nextEvent.title}</strong></span>
            <ArrowUpRight size={15} className="events-glance-arrow" />
          </article>
          <article className="events-glance-item">
            <span className="events-glance-icon tone-violet"><CheckCheck size={17} /></span>
            <span className="events-glance-copy"><small>YOUR RSVPS</small><strong>{registeredEvents.size} registered</strong></span>
          </article>
        </div>
      </section>

      <section className="events-control-section" aria-label="Browse events">
        <div className="section-toolbar events-toolbar">
          <div><p className="section-overline">CAMPUS CALENDAR</p><h2>Upcoming events <span className="heading-count">{String(visibleCount).padStart(2, '0')}</span></h2></div>
          <div className="events-view-switch" role="group" aria-label="Choose event view">
            <button type="button" className={`events-view-button${eventView === 'all' ? ' events-view-button-active' : ''}`} aria-pressed={eventView === 'all'} onClick={() => setEventView('all')}><CalendarDays size={15} /><span>All events</span><small>{eventList.length}</small></button>
            <button type="button" className={`events-view-button${eventView === 'groups' ? ' events-view-button-active' : ''}`} aria-pressed={eventView === 'groups'} onClick={() => { setEventView('groups'); setExpandedGroup(''); }}><UsersRound size={15} /><span>By club</span><small>{groups.length}</small></button>
          </div>
        </div>

        {eventView === 'all' && (
          <div className="events-filter-row">
            <span className="events-filter-label">FILTER BY TYPE</span>
            <div className="filter-pills" role="group" aria-label="Filter events by type">
              {filters.map((filter) => <button key={filter} className={`filter-pill${activeFilter === filter ? ' filter-pill-active' : ''}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
            </div>
          </div>
        )}
      </section>

      {eventView === 'all' ? (
        <div className="event-page-grid">
          {filteredEvents.map((event) => <EventCard key={event.id} event={event} onOpen={(origin) => onOpenEvent(event, origin)} registered={registeredEvents.has(event.id)} />)}
          {filteredEvents.length === 0 && <EmptyState title="No events found" copy="Try another category or check back later." />}
        </div>
      ) : (
        <div className="club-event-groups">
          {groups.map((group) => {
            const isExpanded = expandedGroup === group.name;
            return (
              <section className={`club-event-group${isExpanded ? ' club-event-group-expanded' : ''}`} key={group.name}>
                <button className="club-event-group-toggle" aria-expanded={isExpanded} onClick={() => setExpandedGroup(isExpanded ? '' : group.name)}>
                  <span className={`club-event-group-icon tone-${group.events[0].color}`}><UsersRound size={18} /></span>
                  <span className="club-event-group-copy"><small>CLUB / STUDENT GROUP</small><strong>{group.name}</strong></span>
                  <span className="club-event-group-count">{group.events.length} {group.events.length === 1 ? 'event' : 'events'}</span>
                  <ChevronDown size={17} className="club-event-group-chevron" />
                </button>
                {isExpanded && (
                  <div className="club-event-group-content">
                    <div className="event-page-grid">
                      {group.events.map((event) => <EventCard key={event.id} event={event} onOpen={(origin) => onOpenEvent(event, origin)} registered={registeredEvents.has(event.id)} />)}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

    </div>
  );
}

function EventCard({ event, onOpen, registered }) {
  const date = getDateParts(event.dayOffset);
  return (
    <article className={`event-card event-card-${event.color} clickable-card`} onClick={(clickEvent) => openCardFromSurface(clickEvent, onOpen)}>
      <div className="event-card-heading">
        <span className={`event-card-symbol tone-${event.color}`}><Icon name={event.icon} size={18} /></span>
        <span className={`category-pill category-${event.color}`}>{event.category}</span>
        <span className="event-date-summary">{date.month} {date.day}</span>
      </div>
      <div className="event-card-content">
        <div className="event-day-label">{getEventDayLabel(event.dayOffset)} · {event.time}</div>
        <button className="event-card-title" onClick={(clickEvent) => openCardFromControl(clickEvent, onOpen)}>{event.title}</button>
        <p>{event.summary}</p>
        <div className="event-card-details"><span><Building2 size={14} />{event.venue}</span><span><UsersRound size={14} />{event.host}</span></div>
        <div className="event-card-footer"><span className="event-seat-label"><span className="seat-indicator" />{event.seats}</span><button className={`button button-small${registered ? ' button-registered' : ' button-dark'}`} onClick={(clickEvent) => openCardFromControl(clickEvent, onOpen)}>{registered ? <><Check size={14} /> Registered</> : <>View details <ArrowRight size={14} /></>}</button></div>
      </div>
    </article>
  );
}

function ClubsPage({ clubsJoined, onToggleClub, onOpenClub, onOpenEvent, eventList, onPostEvent }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All groups');
  const categories = ['All groups', 'Technology', 'Arts & culture', 'Ideas & debate', 'Environment', 'Music'];
  const upcomingClubEvents = eventList.filter((event) => event.dayOffset >= 0).slice(0, 3);
  const filteredClubs = clubs.filter((club) => {
    const matchesCategory = activeCategory === 'All groups' || club.category === activeCategory;
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || `${club.name} ${club.category} ${club.description}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="page-stack">
      <PageIntro eyebrow="STUDENT PORTAL / STUDENT GROUPS" title="Clubs & student groups" action={onPostEvent ? <button className="button button-outline club-post-event" onClick={onPostEvent}><CalendarDays size={15} /> Post a club event</button> : undefined} />
      <section className="club-glance" aria-labelledby="club-glance-title">
        <div className="club-glance-heading"><div><p className="section-overline">AT A GLANCE</p><h2 id="club-glance-title">Nearest club events</h2></div></div>
        <div className="club-glance-columns" aria-hidden="true"><span>Date</span><span>Club</span><span>Event</span><span>Location</span></div>
        <div className="club-glance-list">
          {upcomingClubEvents.map((event) => {
            const date = getDateParts(event.dayOffset);
            return (
              <article className="club-glance-row clickable-card" key={event.id} onClick={(clickEvent) => openCardFromSurface(clickEvent, (origin) => onOpenEvent(event, origin))}>
                <span className="club-glance-date" data-label="DATE">{getEventDayLabel(event.dayOffset)} · {date.day} {date.month} · {event.time}</span>
                <span className="club-glance-club" data-label="CLUB">{event.host}</span>
                <span className="club-glance-title" data-label="EVENT">{event.title}</span>
                <span className="club-glance-location" data-label="LOCATION">{event.venue}</span>
              </article>
            );
          })}
          {upcomingClubEvents.length === 0 && <p className="club-glance-empty">No upcoming club events.</p>}
        </div>
      </section>
      <div className="directory-toolbar">
        <div className="filter-pills filter-pills-wrap" role="group" aria-label="Filter clubs">
          {categories.map((category) => <button key={category} className={`filter-pill${activeCategory === category ? ' filter-pill-active' : ''}`} onClick={() => setActiveCategory(category)}>{category}</button>)}
        </div>
        <label className="inline-search"><Search size={16} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search student groups" aria-label="Search student groups" />{searchTerm && <button onClick={() => setSearchTerm('')} aria-label="Clear group search"><X size={14} /></button>}</label>
      </div>
      <div className="club-grid">
        {filteredClubs.map((club) => <ClubCard key={club.id} club={club} joined={clubsJoined.has(club.id)} onToggle={() => onToggleClub(club)} onOpen={(origin) => onOpenClub(club, origin)} />)}
        {filteredClubs.length === 0 && <EmptyState title="No student groups found" copy="Try a different search or category." />}
      </div>
      <div className="club-callout"><span className="club-callout-icon"><Lightbulb size={17} /></span><span><strong>Propose a new student group</strong><small>Submit an idea for review by the Student Life team.</small></span><button onClick={() => onOpenClub({ id: 'new-club', name: 'Propose a student group', category: 'Student group proposal', description: 'Submit a group idea for review by the Student Life team. Include the purpose of the group and the activities you would like to organise.', members: 0, next: 'Proposals are reviewed by Student Life', icon: 'Lightbulb', color: 'lime', initials: 'NEW' })}>Submit proposal <ArrowRight size={14} /></button></div>
    </div>
  );
}

function ClubCard({ club, joined, onToggle, onOpen }) {
  return (
    <article className={`club-card club-card-${club.color} clickable-card`} onClick={(clickEvent) => openCardFromSurface(clickEvent, onOpen)}>
      <div className="club-card-top"><span className={`club-mark tone-${club.color}`}><Icon name={club.icon} size={22} /></span><span className="club-members"><UsersRound size={13} />{club.members}</span></div>
      <span className="club-category">{club.category}</span>
      <button className="club-card-title" onClick={(clickEvent) => openCardFromControl(clickEvent, onOpen)}>{club.name}<ArrowUpRight size={15} /></button>
      <p>{club.description}</p>
      <div className="club-next"><span className="club-next-dot" /><span><small>NEXT MEETING</small><strong>{club.next}</strong></span></div>
      <div className="club-card-footer"><button className="club-details-link" onClick={(clickEvent) => openCardFromControl(clickEvent, onOpen)}>View group details <ArrowRight size={14} /></button><button className={`button button-small${joined ? ' button-joined' : ' button-light'}`} onClick={onToggle}>{joined ? <><Check size={14} /> Joined</> : <>Join group <PlusIcon /></>}</button></div>
    </article>
  );
}

function PlusIcon() {
  return <span className="plus-glyph" aria-hidden="true">+</span>;
}

function DirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Everything');
  const [copiedId, setCopiedId] = useState('');
  const categories = ['Everything', 'People', 'Academic', 'Spaces', 'Support'];
  const filteredDirectory = directory.filter((entry) => {
    const matchesCategory = activeCategory === 'Everything' || entry.category === activeCategory;
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || `${entry.name} ${entry.detail} ${entry.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  const copyContact = async (entry) => {
    try {
      await navigator.clipboard.writeText(entry.contact);
      setCopiedId(entry.id);
      window.setTimeout(() => setCopiedId(''), 1700);
    } catch {
      window.location.href = `mailto:${entry.contact}`;
    }
  };

  return (
    <div className="page-stack">
      <PageIntro eyebrow="STUDENT PORTAL / DIRECTORY" title="Campus directory" action={<span className="intro-chip"><ContactRound size={14} /> {directory.length} listings</span>} />
      <section className="directory-welcome">
        <div className="directory-welcome-icon"><ContactRound size={21} /></div>
        <div><span>PEOPLE AND SERVICES</span><h2>Campus contacts and resources</h2></div>
        <div className="directory-welcome-art" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </section>
      <div className="directory-toolbar">
        <div className="filter-pills filter-pills-wrap" role="group" aria-label="Filter directory">
          {categories.map((category) => <button key={category} className={`filter-pill${activeCategory === category ? ' filter-pill-active' : ''}`} onClick={() => setActiveCategory(category)}>{category}</button>)}
        </div>
        <label className="inline-search"><Search size={16} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search people and services" aria-label="Search directory" />{searchTerm && <button onClick={() => setSearchTerm('')} aria-label="Clear directory search"><X size={14} /></button>}</label>
      </div>
      <div className="directory-grid">
        {filteredDirectory.map((entry) => <article className="directory-card" key={entry.id}>
          <div className="directory-card-top"><span className={`directory-icon tone-${entry.color}`}><Icon name={entry.icon} size={20} /></span><span className="directory-type">{entry.category}</span><button className="directory-more" aria-label={`Copy email for ${entry.name}`} title={`Copy ${entry.contact}`} onClick={() => copyContact(entry)}>{copiedId === entry.id ? <Check size={16} /> : <Copy size={14} />}</button></div>
          <h3>{entry.name}</h3><p>{entry.detail}</p>
          <div className="directory-note"><span className="directory-note-dot" />{entry.note}</div>
          <button className="directory-contact" onClick={() => copyContact(entry)}><Mail size={14} />{copiedId === entry.id ? 'Email copied' : 'Copy email'}<ArrowRight size={14} /></button>
        </article>)}
        {filteredDirectory.length === 0 && <EmptyState title="No directory results" copy="Try searching for a person, service, or department." />}
      </div>
    </div>
  );
}

function AnnouncementsPage({ readAnnouncements, onReadNotice, onAllRead, onOpenNotice }) {
  const unreadCount = announcements.filter((item) => !readAnnouncements.has(item.id)).length;
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="STUDENT PORTAL / CAMPUS ANNOUNCEMENTS"
        title="Notices & announcements"
        action={unreadCount > 0 ? <button className="button button-outline" onClick={onAllRead}><CheckCheck size={16} /> Mark all as read</button> : <span className="intro-chip"><Check size={14} /> All notices read</span>}
      />
      <div className="section-toolbar bulletin-toolbar">
        <div><p className="section-overline">RECENT UPDATES</p><h2>All announcements <span className="heading-count">{String(announcements.length).padStart(2, '0')}</span></h2></div>
        <span className="bulletin-sort"><Activity size={15} /> Most recent</span>
      </div>
      <div className="announcement-feed">
        {announcements.map((item) => <AnnouncementCard key={item.id} item={item} isRead={readAnnouncements.has(item.id)} onClick={(origin) => { onReadNotice(item.id); onOpenNotice(item, origin); }} />)}
      </div>
    </div>
  );
}

function AnnouncementCard({ item, isRead, onClick }) {
  return (
    <article className={`announcement-card clickable-card${isRead ? '' : ' announcement-unread'}`} onClick={(clickEvent) => openCardFromSurface(clickEvent, onClick)}>
      <span className={`announcement-icon tone-${item.color}`}><Icon name={item.icon} size={19} /></span>
      <div className="announcement-card-content"><div className="announcement-meta"><span>{item.category}</span><i />{item.time}<i />Posted by {item.author}</div><button onClick={(clickEvent) => openCardFromControl(clickEvent, onClick)} className="announcement-title">{item.title}</button><p>{item.body}</p></div>
      {!isRead && <span className="announcement-new">UNREAD</span>}
      <button className="announcement-open" onClick={(clickEvent) => openCardFromControl(clickEvent, onClick)} aria-label={`Read ${item.title}`}><ArrowUpRight size={16} /></button>
    </article>
  );
}

function ClassPage({ roleMode, classUpdates, unreadClassUpdateIds, completedTasks, onToggleTask, onPostUpdate, onRemoveUpdate, onMarkUpdatesRead }) {
  const orderedDeadlines = [...classDeadlines].sort((first, second) => first.dayOffset - second.dayOffset);
  const nextDeadline = orderedDeadlines.find((task) => !completedTasks.has(task.id));
  const nextDeadlineDate = nextDeadline ? getDateParts(nextDeadline.dayOffset) : null;
  const otherDeadlines = orderedDeadlines
    .filter((task) => task.id !== nextDeadline?.id)
    .sort((first, second) => Number(completedTasks.has(first.id)) - Number(completedTasks.has(second.id)) || first.dayOffset - second.dayOffset);
  const openDeadlineCount = orderedDeadlines.filter((task) => !completedTasks.has(task.id)).length;
  const unreadUpdateCount = classUpdates.filter((item) => unreadClassUpdateIds.has(item.id)).length;
  const isRepresentative = roleMode === 'class-representative';

  return (
    <div className="page-stack class-page">
      <PageIntro
        eyebrow="MY CLASS / YEAR 2 · SECTION A"
        title="My class"
        action={isRepresentative && <button className="button button-lime" onClick={onPostUpdate}><Megaphone size={15} /> Post class update</button>}
      />

      <section className="class-deadlines-panel" aria-labelledby="class-deadlines-title">
        <div className="class-panel-heading class-deadlines-heading">
          <div><p className="section-overline">YOUR NEXT ACTION</p><h2 id="class-deadlines-title">Due soon</h2></div>
          <span className={`class-deadline-count${openDeadlineCount === 0 ? ' class-deadline-count-done' : ''}`}>
            {openDeadlineCount === 0 ? 'ALL CAUGHT UP' : `${openDeadlineCount} TO DO`}
          </span>
        </div>

        {nextDeadline ? (
          <article className={`class-deadline-feature${nextDeadline.dayOffset <= 1 ? ' class-deadline-feature-urgent' : ''}`}>
            <span className="class-deadline-date" aria-label={`${nextDeadlineDate.weekday}, ${nextDeadlineDate.day} ${nextDeadlineDate.month}`}>
              <small>{nextDeadlineDate.month}</small>
              <strong>{nextDeadlineDate.day}</strong>
              <span>{nextDeadlineDate.weekday}</span>
            </span>
            <div className="class-deadline-feature-copy">
              <div className="class-deadline-feature-meta"><span className="class-deadline-kind">{nextDeadline.kind}</span><span>{nextDeadline.course}</span></div>
              <h3>{nextDeadline.title}</h3>
              <p><CalendarDays size={13} />{getDeadlineDueLabel(nextDeadline.dayOffset)} <i /> {nextDeadline.dueTime}</p>
            </div>
            <button className="class-deadline-primary-action" onClick={() => onToggleTask(nextDeadline.id)} aria-label={`Mark done in my tracker: ${nextDeadline.title}`}>
              <Check size={15} /><span>Mark done</span>
            </button>
          </article>
        ) : (
          <div className="class-deadline-all-clear"><span><CheckCheck size={18} /></span><div><strong>All caught up</strong><small>You’ve completed every deadline in this list.</small></div></div>
        )}

        {otherDeadlines.length > 0 && (
          <div className="class-deadline-list" aria-label="Other class deadlines">
            {otherDeadlines.map((task) => {
              const isComplete = completedTasks.has(task.id);
              return (
                <article className={`class-deadline-row${isComplete ? ' class-deadline-done' : ''}`} key={task.id}>
                  <button className={`class-task-check${isComplete ? ' class-task-check-done' : ''}`} onClick={() => onToggleTask(task.id)} aria-label={`${isComplete ? 'Mark not done' : 'Mark done'} in my tracker: ${task.title}`} aria-pressed={isComplete}>
                    {isComplete && <Check size={13} />}
                  </button>
                  <span className="class-deadline-copy"><strong>{task.title}</strong><small>{task.course} · {task.kind.toLowerCase()}</small></span>
                  <span className="class-deadline-when">{getDeadlineDueLabel(task.dayOffset)}<small>{task.dueTime}</small></span>
                </article>
              );
            })}
          </div>
        )}
        <p className="class-deadline-footnote"><CheckCheck size={13} /> Personal checklist only · marking done doesn’t submit coursework.</p>
      </section>

      <section className="class-updates-panel">
        <div className="class-panel-heading class-updates-heading">
          <div><p className="section-overline">CLASS REP · SECTION A ONLY</p><h2>Class updates {unreadUpdateCount > 0 && <span className="new-indicator">{unreadUpdateCount} NEW</span>}</h2></div>
          {!isRepresentative && unreadUpdateCount > 0 && <button className="class-update-mark-read" onClick={onMarkUpdatesRead}>Mark all read</button>}
        </div>
        <div className="class-update-list">
          {classUpdates.map((item) => <ClassUpdateCard key={item.id} item={item} isUnread={unreadClassUpdateIds.has(item.id)} canManage={isRepresentative && item.isLocal} onRemove={() => onRemoveUpdate(item.id)} />)}
          {classUpdates.length === 0 && <p className="class-empty">No class-rep updates yet.</p>}
        </div>
      </section>
    </div>
  );
}

function ClassUpdateCard({ item, isUnread, canManage, onRemove }) {
  return (
    <article className={`class-update-card${isUnread ? ' class-update-unread' : ''}`}>
      <span className={`class-update-icon tone-${item.color || 'lime'}`}><Icon name={item.icon || 'Megaphone'} size={17} /></span>
      <div className="class-update-copy"><div className="class-update-meta"><span>{item.category}</span>{isUnread && <b className="class-update-new-pill">NEW</b>}<i />{item.time}</div><h3>{item.title}</h3><p>{item.body}</p><small>From {item.author}</small></div>
      {canManage && <button className="class-update-remove" onClick={onRemove} aria-label={`Remove your update: ${item.title}`} title="Remove preview update"><X size={15} /></button>}
    </article>
  );
}

function PostClassUpdateModal({ onClose, onPublish }) {
  const [category, setCategory] = useState('Class notice');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const now = new Date();
    const icon = category === 'Schedule change' ? 'CalendarDays' : category === 'Assessment reminder' ? 'BookOpen' : 'Megaphone';
    const color = category === 'Schedule change' ? 'orange' : category === 'Assessment reminder' ? 'violet' : 'lime';
    onPublish({
      id: `class-update-${Date.now()}`,
      category,
      title: title.trim(),
      body: body.trim(),
      author: 'Class representative',
      time: `Today · ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
      icon,
      color,
      isLocal: true,
    });
  };

  return (
    <Modal onClose={onClose}>
      <div className="feedback-modal-icon class-update-modal-icon"><Megaphone size={21} /></div>
      <div className="modal-main feedback-modal-main">
        <div className="modal-eyebrow">CLASS REPRESENTATIVE · PREVIEW</div>
        <h2>Post a class update</h2>
        <p className="modal-description">Share a schedule change, class notice, or assessment reminder with this section preview.</p>
        <form onSubmit={handleSubmit} className="feedback-form class-update-form">
          <label>UPDATE TYPE<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Class notice</option><option>Schedule change</option><option>Assessment reminder</option></select></label>
          <label>HEADLINE<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Keep the headline specific" maxLength={90} required /></label>
          <label>DETAILS<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="What does your class need to know?" rows={4} maxLength={360} required /></label>
          <div className="modal-footer"><span className="modal-seat"><ShieldCheck size={14} /> Saved in this browser only</span><button className="button button-lime" type="submit" disabled={!title.trim() || !body.trim()}>Post update <ArrowRight size={15} /></button></div>
        </form>
      </div>
    </Modal>
  );
}

function PageIntro({ eyebrow, title, description, action }) {
  return (
    <div className={`page-intro${description ? '' : ' page-intro-compact'}`}>
      <div><div className="eyebrow"><span className="eyebrow-live-dot" />{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {action && <div className="page-intro-action">{action}</div>}
    </div>
  );
}

function EmptyState({ title, copy }) {
  return <div className="empty-state"><span><Search size={19} /></span><strong>{title}</strong><p>{copy}</p></div>;
}

function EventModal({ event, isRegistered, onRegister, onClose, showToast, origin }) {
  return <Modal onClose={onClose} origin={origin}><EventModalContent event={event} isRegistered={isRegistered} onRegister={onRegister} showToast={showToast} /></Modal>;
}

function EventModalContent({ event, isRegistered, onRegister, showToast }) {
  const date = getDateParts(event.dayOffset);
  return (
    <>
      <div className={`modal-banner modal-banner-${event.color}`}><span className="modal-banner-icon"><Icon name={event.icon} size={27} /></span><span className="category-pill category-pill-light">{event.category}</span><span className="modal-banner-date"><b>{date.day}</b><small>{date.month}</small></span></div>
      <div className="modal-main"><div className="modal-eyebrow">{getEventDayLabel(event.dayOffset)} · {event.duration}</div><h2>{event.title}</h2><p className="modal-description">{event.summary}</p>
        <div className="modal-facts"><div><span className="modal-fact-icon"><CalendarDays size={16} /></span><span><small>WHEN</small><strong>{date.full} · {event.time}</strong></span></div><div><span className="modal-fact-icon"><Building2 size={16} /></span><span><small>WHERE</small><strong>{event.venue}</strong></span></div><div><span className="modal-fact-icon"><UsersRound size={16} /></span><span><small>HOSTED BY</small><strong>{event.host}</strong></span></div></div>
        <div className="modal-footer"><span className="modal-seat"><span className="seat-indicator" />{event.seats}</span><button className={`button${isRegistered ? ' button-registered' : ' button-lime'}`} onClick={() => { if (isRegistered) { showToast('You are already registered for this event.'); return; } onRegister(event); showToast('Registration saved in this demo.'); }}>{isRegistered ? <><Check size={16} /> Registered</> : <>Register for event <ArrowRight size={15} /></>}</button></div>
      </div>
    </>
  );
}

function ClubModal({ club, joined, onToggle, onClose, showToast, origin }) {
  return <Modal onClose={onClose} origin={origin}><ClubModalContent club={club} joined={joined} onToggle={onToggle} showToast={showToast} /></Modal>;
}

function ClubModalContent({ club, joined, onToggle, showToast }) {
  return (
    <>
      <div className={`club-modal-cover club-modal-cover-${club.color || 'lime'}`}><span className="club-modal-symbol"><Icon name={club.icon || 'Lightbulb'} size={29} /></span><span className="club-modal-mark">STUDENT GROUP DETAILS</span><span className="club-modal-stars">✳</span></div>
      <div className="modal-main"><div className="modal-eyebrow">{club.category} <i /> {club.members ? `${club.members} MEMBERS` : 'SUBMIT A PROPOSAL'}</div><h2>{club.name}</h2><p className="modal-description">{club.description}</p><div className="club-modal-next"><span className="club-next-dot" /><span><small>NEXT MEETING</small><strong>{club.next}</strong></span></div><div className="modal-footer"><span className="modal-seat"><UsersRound size={15} />{club.members ? `${club.members} members` : 'Submit a group proposal for review'}</span><button className={`button${joined ? ' button-registered' : ' button-lime'}`} onClick={() => { onToggle(club); if (!joined && club.id !== 'new-club') showToast(`Your membership status for ${club.name} was updated.`); }}>{joined ? <><Check size={16} /> Joined</> : <>{club.id === 'new-club' ? 'Submit proposal' : 'Join group'} <ArrowRight size={15} /></>}</button></div></div>
    </>
  );
}

function NoticeModal({ item, onClose, origin }) {
  return <Modal onClose={onClose} origin={origin}><NoticeModalContent item={item} onClose={onClose} /></Modal>;
}

function NoticeModalContent({ item, onClose }) {
  return (
    <>
      <div className={`notice-modal-mark tone-${item.color}`}><Icon name={item.icon} size={22} /></div>
      <div className="modal-main notice-modal-main"><div className="modal-eyebrow">{item.category} <i /> {item.time}</div><h2>{item.title}</h2><p className="modal-description notice-modal-body">{item.body}</p><div className="notice-author"><span className="notice-author-avatar"><Icon name={item.icon} size={15} /></span><span><small>POSTED BY</small><strong>{item.author}</strong></span></div><div className="modal-footer"><span className="modal-seat">Campus announcement <span className="tiny-divider" /> Sample data</span><button className="button button-dark" onClick={onClose}>Close <Check size={15} /></button></div></div>
    </>
  );
}

function FeedbackModal({ onClose, showToast }) {
  const [category, setCategory] = useState('A feature idea');
  const [message, setMessage] = useState('');
  const handleSubmit = (event) => {
    event.preventDefault();
    onClose();
    showToast('Thank you for your feedback. Nothing is sent or stored in this demo.');
  };
  return (
    <Modal onClose={onClose}>
      <div className="feedback-modal-icon"><MessageSquareText size={22} /></div>
      <div className="modal-main feedback-modal-main"><div className="modal-eyebrow">STUDENT PORTAL FEEDBACK</div><h2>Submit feedback</h2><p className="modal-description">Send feedback about campus information, student services, events, or a technical issue.</p>
        <form onSubmit={handleSubmit} className="feedback-form"><label>THIS IS ABOUT<select value={category} onChange={(event) => setCategory(event.target.value)}><option>A feature idea</option><option>Campus information</option><option>An event or club</option><option>Something not working</option></select></label><label>YOUR NOTE<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe your feedback..." required rows={4} /></label><div className="modal-footer"><span className="modal-seat"><ShieldCheck size={14} /> Just a prototype — no data is sent</span><button className="button button-lime" type="submit" disabled={!message.trim()}>Submit feedback <Send size={15} /></button></div></form>
      </div>
    </Modal>
  );
}

function PostClubEventModal({ onClose, onPublish }) {
  const [clubId, setClubId] = useState(clubs[0]?.id || '');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [startsAt, setStartsAt] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(17, 0, 0, 0);
    return toDateTimeInputValue(start);
  });
  const [endsAt, setEndsAt] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(18, 0, 0, 0);
    return toDateTimeInputValue(end);
  });
  const [timeError, setTimeError] = useState('');
  const club = clubs.find((item) => item.id === clubId);
  const minStart = toDateTimeInputValue(new Date());

  const handleStartChange = (value) => {
    setStartsAt(value);
    setTimeError('');
    if (value && endsAt && new Date(endsAt) <= new Date(value)) {
      const nextEnd = new Date(value);
      nextEnd.setHours(nextEnd.getHours() + 1);
      setEndsAt(toDateTimeInputValue(nextEnd));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (!club || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setTimeError('Choose an end time after the event starts.');
      return;
    }

    onPublish({
      id: `club-event-${Date.now()}`,
      title: title.trim(),
      category: 'Club event',
      summary: `A new event posted by ${club.name}.`,
      host: club.name,
      time: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      venue: venue.trim(),
      dayOffset: getDayOffsetForDate(start),
      duration: formatDuration(start, end),
      color: club.color,
      icon: club.icon,
      seats: 'Open to all',
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      postedAt: new Date().toISOString(),
    });
  };

  return (
    <Modal onClose={onClose}>
      <div className="feedback-modal-icon post-event-modal-icon"><CalendarDays size={22} /></div>
      <div className="modal-main feedback-modal-main">
        <div className="modal-eyebrow">CLUB EVENTS</div>
        <h2>Post a club event</h2>
        <p className="modal-description">Publish the event details. A notice will stay visible until the event ends.</p>
        <form onSubmit={handleSubmit} className="feedback-form post-event-form">
          <label>CLUB / STUDENT GROUP<select value={clubId} onChange={(event) => setClubId(event.target.value)} required>{clubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>EVENT TITLE<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" required maxLength={90} /></label>
          <div className="post-event-time-grid">
            <label>STARTS<input type="datetime-local" value={startsAt} min={minStart} onChange={(event) => handleStartChange(event.target.value)} required /></label>
            <label>ENDS<input type="datetime-local" value={endsAt} min={startsAt || minStart} onChange={(event) => { setEndsAt(event.target.value); setTimeError(''); }} required /></label>
          </div>
          {timeError && <p className="post-event-error" role="alert">{timeError}</p>}
          <label>LOCATION<input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Building or campus location" required maxLength={100} /></label>
          <div className="modal-footer">
            <span className="modal-seat"><ShieldCheck size={14} /> Saved in this browser only</span>
            <button className="button button-lime" type="submit">Publish event <ArrowRight size={15} /></button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function PostedEventPopup({ event, onDismiss }) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const dateLabel = start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const endLabel = `${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;

  return (
    <aside className="posted-event-popup" role="status" aria-live="polite">
      <span className="posted-event-popup-icon"><CalendarDays size={18} /></span>
      <div className="posted-event-popup-copy">
        <small>NEW CLUB EVENT</small>
        <strong>{event.title}</strong>
        <span>{event.host} · {dateLabel} · {event.time}</span>
        <span>{event.venue}</span>
        <em>Visible until {endLabel}</em>
      </div>
      <button className="icon-button posted-event-dismiss" onClick={onDismiss} aria-label="Dismiss this event notice"><X size={16} /></button>
    </aside>
  );
}

function Modal({ children, onClose, origin }) {
  const shellRef = useRef(null);
  const hasOrigin = Boolean(origin && origin.width > 0 && origin.height > 0 && typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function');

  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const computedPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell || !hasOrigin || typeof shell.animate !== 'function' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const target = shell.getBoundingClientRect();
    if (!target.width || !target.height) return undefined;
    shell.getAnimations().forEach((animation) => animation.cancel());

    const translateX = origin.left - target.left;
    const translateY = origin.top - target.top;
    const scaleX = origin.width / target.width;
    const scaleY = origin.height / target.height;
    const finalRadius = window.getComputedStyle(shell).borderRadius;
    const animation = shell.animate([
      { transformOrigin: 'top left', transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`, borderRadius: origin.borderRadius || '14px', opacity: .94 },
      { transformOrigin: 'top left', transform: 'translate3d(0, 0, 0) scale(1, 1)', borderRadius: finalRadius, opacity: 1 },
    ], { duration: 620, easing: 'cubic-bezier(.22, .72, .2, 1)', fill: 'both' });

    return () => {
      animation.onfinish = null;
      if (animation.playState !== 'idle') animation.cancel();
    };
  }, [hasOrigin, origin]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={shellRef} className={`modal-shell${hasOrigin ? ' modal-shell-origin' : ''}`} role="dialog" aria-modal="true">
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        {children}
      </section>
    </div>
  );
}

function OriginCardExpansion({ modal, onClose, isClosing, isRegistered, onRegister, showToast }) {
  const element = modal.origin?.element;
  const registerTarget = modal.type === 'event' && element?.isConnected
    ? element.querySelector('.event-card-footer') || element
    : null;
  const [phase, setPhase] = useState('opening');

  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const computedPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, []);

  useLayoutEffect(() => {
    if (!element?.isConnected) return undefined;
    const origin = modal.origin || getCardRect(element);
    if (!origin?.width || !origin?.height) return undefined;

    const styleProperties = ['position', 'left', 'top', 'width', 'height', 'zIndex', 'maxHeight', 'maxWidth', 'overflow', 'minHeight', 'minWidth', 'transformOrigin'];
    const previousStyles = Object.fromEntries(styleProperties.map((property) => [property, element.style[property]]));
    const previousAttributes = Object.fromEntries(['role', 'aria-modal', 'aria-label', 'tabindex'].map((name) => [name, element.getAttribute(name)]));
    const transitionClasses = ['modal-shell', 'modal-shell-origin', 'origin-card-expanded', 'origin-card-expansion-opening', 'origin-card-expansion-open', 'origin-card-expansion-closing'];
    const originalClasses = new Map(transitionClasses.map((name) => [name, element.classList.contains(name)]));
    const sourceLayout = window.getComputedStyle(element);
    const placeholder = document.createElement('div');
    placeholder.className = 'origin-card-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.boxSizing = 'border-box';
    placeholder.style.width = `${origin.width}px`;
    placeholder.style.height = `${origin.height}px`;
    placeholder.style.margin = sourceLayout.margin;
    placeholder.style.flex = sourceLayout.flex;
    placeholder.style.gridColumn = sourceLayout.gridColumn;
    placeholder.style.gridRow = sourceLayout.gridRow;
    placeholder.style.alignSelf = sourceLayout.alignSelf;
    placeholder.style.justifySelf = sourceLayout.justifySelf;
    placeholder.style.minWidth = '0';
    placeholder.style.minHeight = '0';
    element.parentNode?.insertBefore(placeholder, element);

    const restoreSource = () => {
      element.getAnimations?.().forEach((animation) => animation.cancel());
      for (const property of styleProperties) element.style[property] = previousStyles[property];
      for (const [name, wasPresent] of originalClasses) element.classList.toggle(name, wasPresent);
      element.focus?.({ preventScroll: true });
      for (const [name, value] of Object.entries(previousAttributes)) {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      }
      placeholder.remove();
    };

    element.classList.add('modal-shell', 'modal-shell-origin', 'origin-card-expanded', 'origin-card-expansion-opening');
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
    element.setAttribute('aria-label', modal.item?.title || modal.item?.name || 'Details');
    element.setAttribute('tabindex', '-1');
    element.focus?.({ preventScroll: true });
    element.style.position = 'fixed';
    element.style.zIndex = '101';
    element.style.overflow = 'auto';
    element.style.minHeight = '0';
    element.style.minWidth = '0';
    element.style.maxWidth = 'none';

    const pagePadding = window.innerWidth <= 600 ? 12 : 24;
    const targetWidth = Math.max(1, Math.min(560, window.innerWidth - pagePadding * 2));
    const maxHeight = Math.max(1, Math.min(760, window.innerHeight - pagePadding * 2));
    element.style.width = `${targetWidth}px`;
    element.style.height = 'auto';
    element.style.left = `${(window.innerWidth - targetWidth) / 2}px`;
    element.style.top = '0px';
    element.style.maxHeight = `${maxHeight}px`;

    const minimumHeight = element.classList.contains('announcement-card') ? 260 : 350;
    const targetHeight = Math.max(Math.min(minimumHeight, maxHeight), Math.min(maxHeight, element.scrollHeight));
    const targetLeft = (window.innerWidth - targetWidth) / 2;
    const targetTop = (window.innerHeight - targetHeight) / 2;
    element.style.height = `${targetHeight}px`;
    element.style.left = `${targetLeft}px`;
    element.style.top = `${targetTop}px`;

    const focusCloseButton = () => {
      if (element.isConnected) element.querySelector(':scope > .origin-card-close')?.focus({ preventScroll: true });
    };
    const finalRadius = window.getComputedStyle(element).borderRadius;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || typeof element.animate !== 'function') {
      setPhase('open');
      window.requestAnimationFrame(focusCloseButton);
      return restoreSource;
    }

    const translateX = origin.left - targetLeft;
    const translateY = origin.top - targetTop;
    const scaleX = origin.width / targetWidth;
    const scaleY = origin.height / targetHeight;
    const animation = element.animate([
      { transformOrigin: 'top left', transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`, borderRadius: origin.borderRadius || '14px', opacity: .98 },
      { transformOrigin: 'top left', transform: 'translate3d(0, 0, 0) scale(1, 1)', borderRadius: finalRadius, opacity: 1 },
    ], { duration: 620, easing: 'cubic-bezier(.22, .72, .2, 1)', fill: 'both' });
    animation.onfinish = () => {
      setPhase('open');
      window.requestAnimationFrame(focusCloseButton);
    };

    return () => {
      animation.onfinish = null;
      restoreSource();
    };
  }, [element, modal.item, modal.origin]);

  useLayoutEffect(() => {
    if (!element?.isConnected) return;
    element.classList.toggle('origin-card-expansion-opening', phase === 'opening' && !isClosing);
    element.classList.toggle('origin-card-expansion-open', phase === 'open' && !isClosing);
    element.classList.toggle('origin-card-expansion-closing', isClosing);
  }, [element, isClosing, phase]);

  useEffect(() => {
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const registerEvent = (event) => {
    event.stopPropagation();
    if (isRegistered) {
      showToast('You are already registered for this event.');
      return;
    }
    onRegister(modal.item);
    showToast('Registration saved in this demo.');
  };

  return (
    <>
      <div className="modal-backdrop modal-backdrop-origin" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} />
      {element?.isConnected && createPortal(
        <button className="modal-close icon-button origin-card-close" type="button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>,
        element,
      )}
      {registerTarget && createPortal(
        <button className={`button origin-card-register${isRegistered ? ' button-registered' : ' button-lime'}`} type="button" onClick={registerEvent}>
          {isRegistered ? <><Check size={16} /> Registered</> : <>Register for event <ArrowRight size={15} /></>}
        </button>,
        registerTarget,
      )}
    </>
  );
}

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [toast, setToast] = useState('');
  const [clubsJoined, setClubsJoined] = useStoredSet('campustwin-joined-clubs', ['first-principles']);
  const [registeredEvents, setRegisteredEvents] = useStoredSet('campustwin-registered-events', []);
  const [readAnnouncements, setReadAnnouncements] = useStoredSet('campustwin-read-notices', ['open-studio']);
  const [roleMode, setRoleMode] = useStoredValue('campustwin-role-mode', 'student', ['student', 'class-representative']);
  const [completedClassTasks, setCompletedClassTasks] = useStoredSet('campustwin-completed-class-tasks', []);
  const [classUpdates, setClassUpdates] = useStoredList('campustwin-class-updates', initialClassUpdates);
  const [seenClassUpdates, setSeenClassUpdates] = useStoredSet('campustwin-seen-class-updates', initialClassUpdates.map((item) => item.id));
  const [postedEvents, setPostedEvents] = useStoredList('campustwin-posted-club-events');
  const [dismissedEventNotices, setDismissedEventNotices] = useStoredSet('campustwin-dismissed-club-event-notices', []);
  const [clockNow, setClockNow] = useState(Date.now());
  const searchWrapRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const modalCloseTimerRef = useRef(null);
  const modalCloseLockRef = useRef(false);

  useEffect(() => {
    setClassUpdates((current) => {
      let hasLegacySample = false;
      const normalized = current.map((item) => {
        if (item.id !== 'project-check-in' || item.author !== 'Course team') return item;
        hasLegacySample = true;
        return { ...item, author: 'Class representative' };
      });
      return hasLegacySample ? normalized : current;
    });
  }, [setClassUpdates]);

  const showModal = useCallback((nextModal) => {
    document.querySelector('.modal-shell')?.getAnimations?.().forEach((animation) => animation.cancel());
    window.clearTimeout(modalCloseTimerRef.current);
    modalCloseTimerRef.current = null;
    modalCloseLockRef.current = false;
    setIsModalClosing(false);
    setModal(nextModal);
  }, []);

  const closeModal = useCallback(() => {
    if (!modal || modalCloseLockRef.current) return;
    const shell = document.querySelector('.modal-shell');
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      shell?.getAnimations?.().forEach((animation) => animation.cancel());
      setModal(null);
      setIsModalClosing(false);
      return;
    }

    let closeDelay = 260;
    if (shell?.animate && modal.origin?.width && modal.origin?.height) {
      const originElement = modal.origin.element;
      const isExpandedSource = originElement?.classList.contains('origin-card-expanded');
      const currentOrigin = isExpandedSource ? modal.origin : originElement?.isConnected ? getCardRect(originElement) || modal.origin : modal.origin;
      const currentRect = shell.getBoundingClientRect();
      const currentStyle = window.getComputedStyle(shell);
      const currentRadius = currentStyle.borderRadius;
      const parsedOpacity = Number.parseFloat(currentStyle.opacity);
      const currentOpacity = Number.isFinite(parsedOpacity) ? parsedOpacity : 1;
      shell.getAnimations().forEach((animation) => animation.cancel());
      const layoutRect = shell.getBoundingClientRect();
      if (layoutRect.width && layoutRect.height) {
        const translateX = currentOrigin.left - layoutRect.left;
        const translateY = currentOrigin.top - layoutRect.top;
        const scaleX = currentOrigin.width / layoutRect.width;
        const scaleY = currentOrigin.height / layoutRect.height;
        const startX = currentRect.left - layoutRect.left;
        const startY = currentRect.top - layoutRect.top;
        const startScaleX = currentRect.width / layoutRect.width;
        const startScaleY = currentRect.height / layoutRect.height;
        const originRadius = currentOrigin.borderRadius || '14px';
        const closeDuration = 520;
        shell.animate([
          { transformOrigin: 'top left', transform: `translate3d(${startX}px, ${startY}px, 0) scale(${startScaleX}, ${startScaleY})`, borderRadius: currentRadius, opacity: currentOpacity },
          { offset: .82, transformOrigin: 'top left', transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`, borderRadius: originRadius, opacity: .98 },
          { transformOrigin: 'top left', transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`, borderRadius: originRadius, opacity: 0 },
        ], { duration: closeDuration, easing: 'cubic-bezier(.38, 0, .22, 1)', fill: 'both' });
        closeDelay = closeDuration + 30;
      }
    } else {
      shell?.getAnimations?.().forEach((animation) => animation.cancel());
    }

    modalCloseLockRef.current = true;
    setIsModalClosing(true);
    modalCloseTimerRef.current = window.setTimeout(() => {
      setModal(null);
      setIsModalClosing(false);
      modalCloseLockRef.current = false;
      modalCloseTimerRef.current = null;
    }, closeDelay);
  }, [modal]);

  const eventList = useMemo(() => {
    const livePostedEvents = postedEvents.filter((event) => Number.isFinite(Date.parse(event.endsAt)) && Date.parse(event.endsAt) > clockNow);
    return [...events, ...livePostedEvents].sort((first, second) => getEventStartTimestamp(first) - getEventStartTimestamp(second));
  }, [postedEvents, clockNow]);
  const activeEventNotice = postedEvents.find((event) => Date.parse(event.endsAt) > clockNow && !dismissedEventNotices.has(event.id));
  const unreadCount = announcements.filter((item) => !readAnnouncements.has(item.id)).length;
  const unreadClassUpdates = roleMode === 'student' ? classUpdates.filter((item) => !seenClassUpdates.has(item.id)) : [];
  const unreadClassUpdateIds = new Set(unreadClassUpdates.map((item) => item.id));
  const notificationCount = unreadCount + unreadClassUpdates.length;
  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];
    const allResults = [
      ...eventList.map((item) => ({ id: item.id, title: item.title, detail: item.summary, type: 'event', typeLabel: `Event · ${item.category}`, icon: item.icon, color: item.color, item })),
      ...clubs.map((item) => ({ id: item.id, title: item.name, detail: `${item.category} ${item.description}`, type: 'club', typeLabel: `Community · ${item.category}`, icon: item.icon, color: item.color, item })),
      ...directory.map((item) => ({ id: item.id, title: item.name, detail: `${item.category} ${item.detail}`, type: 'directory', typeLabel: `Directory · ${item.category}`, icon: item.icon, color: item.color, item })),
      ...announcements.map((item) => ({ id: item.id, title: item.title, detail: `${item.category} ${item.body}`, type: 'notice', typeLabel: `Announcement · ${item.category}`, icon: item.icon, color: item.color, item })),
    ];
    return allResults.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query)).slice(0, 6);
  }, [eventList, searchValue]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(''), 3400);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(toastTimeoutRef.current);
    window.clearTimeout(modalCloseTimerRef.current);
  }, []);

  useEffect(() => {
    const endTimes = postedEvents.map((event) => Date.parse(event.endsAt)).filter((endTime) => Number.isFinite(endTime) && endTime > clockNow);
    if (!endTimes.length) return undefined;
    const nextEndTime = Math.min(...endTimes);
    const timer = window.setTimeout(() => setClockNow(Date.now()), Math.min(nextEndTime - clockNow, 2147483647));
    return () => window.clearTimeout(timer);
  }, [postedEvents, clockNow]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = useCallback((page) => {
    const isPageChange = activePage !== page;
    setActivePage(page);
    setIsMobileNavOpen(false);
    setIsNotificationsOpen(false);
    setSearchOpen(false);
    setSearchValue('');
    if (isPageChange) {
      const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      window.scrollTo({ top: 0, behavior });
    }
  }, [activePage]);

  const setNoticeRead = useCallback((id) => {
    setReadAnnouncements((current) => new Set([...current, id]));
  }, [setReadAnnouncements]);

  const markAllRead = useCallback(() => {
    setReadAnnouncements(new Set(announcements.map((item) => item.id)));
    showToast('All announcements have been marked as read.');
  }, [setReadAnnouncements, showToast]);

  const markAllClassUpdatesRead = useCallback(() => {
    setSeenClassUpdates((current) => new Set([...current, ...classUpdates.map((item) => item.id)]));
  }, [classUpdates, setSeenClassUpdates]);

  const markAllNotificationsRead = useCallback(() => {
    setReadAnnouncements(new Set(announcements.map((item) => item.id)));
    markAllClassUpdatesRead();
    showToast('All updates have been marked as read.');
  }, [markAllClassUpdatesRead, setReadAnnouncements, showToast]);

  const toggleRegistration = useCallback((event) => {
    setRegisteredEvents((current) => {
      const next = new Set(current);
      if (next.has(event.id)) next.delete(event.id);
      else next.add(event.id);
      return next;
    });
  }, [setRegisteredEvents]);

  const toggleClassTask = useCallback((taskId) => {
    setCompletedClassTasks((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, [setCompletedClassTasks]);

  const toggleClub = useCallback((club) => {
    if (club.id === 'new-club') {
      showModal({ type: 'feedback' });
      return;
    }
    setClubsJoined((current) => {
      const next = new Set(current);
      if (next.has(club.id)) next.delete(club.id);
      else next.add(club.id);
      return next;
    });
  }, [setClubsJoined, showModal]);

  const openNotice = useCallback((item, origin) => {
    setIsNotificationsOpen(false);
    if (!item) {
      navigate('announcements');
      return;
    }
    setNoticeRead(item.id);
    showModal({ type: 'notice', item, origin });
  }, [navigate, setNoticeRead, showModal]);

  const chooseSearchResult = useCallback((result) => {
    setSearchOpen(false);
    setSearchValue('');
    setActivePage(result.type === 'notice' ? 'announcements' : result.type === 'event' ? 'events' : result.type === 'club' ? 'clubs' : 'directory');
    setIsMobileNavOpen(false);
    if (result.type === 'event') showModal({ type: 'event', item: result.item });
    if (result.type === 'club') showModal({ type: 'club', item: result.item });
    if (result.type === 'notice') {
      setNoticeRead(result.id);
      showModal({ type: 'notice', item: result.item });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setNoticeRead, showModal]);

  const openFeedback = useCallback(() => showModal({ type: 'feedback' }), [showModal]);
  const openEvent = useCallback((event, origin) => showModal({ type: 'event', item: event, origin }), [showModal]);
  const openClub = useCallback((club, origin) => showModal({ type: 'club', item: club, origin }), [showModal]);
  const openPostEvent = useCallback(() => showModal({ type: 'post-event' }), [showModal]);
  const openPostClassUpdate = useCallback(() => showModal({ type: 'class-update' }), [showModal]);
  const publishClassUpdate = useCallback((update) => {
    setClassUpdates((current) => [update, ...current]);
    closeModal();
    showToast('Class update added to this browser preview.');
  }, [closeModal, setClassUpdates, showToast]);
  const removeClassUpdate = useCallback((id) => {
    setClassUpdates((current) => current.filter((item) => item.id !== id));
    showToast('Class update removed from this browser preview.');
  }, [setClassUpdates, showToast]);
  const publishClubEvent = useCallback((event) => {
    setPostedEvents((current) => [event, ...current]);
    setDismissedEventNotices((current) => {
      const next = new Set(current);
      next.delete(event.id);
      return next;
    });
    setClockNow(Date.now());
    closeModal();
  }, [closeModal, setDismissedEventNotices, setPostedEvents]);
  const dismissEventNotice = useCallback((id) => {
    setDismissedEventNotices((current) => new Set([...current, id]));
  }, [setDismissedEventNotices]);

  const canPostClubEvents = false; // Enable only after club leader/core-member profiles and authorization exist.
  let currentPage;
  if (activePage === 'events') currentPage = <EventsPage onOpenEvent={openEvent} registeredEvents={registeredEvents} eventList={eventList} />;
  else if (activePage === 'clubs') currentPage = <ClubsPage clubsJoined={clubsJoined} onToggleClub={(club) => { const wasJoined = clubsJoined.has(club.id); toggleClub(club); if (!wasJoined) showToast(`Your membership status for ${club.name} was updated.`); }} onOpenClub={openClub} onOpenEvent={openEvent} eventList={eventList} onPostEvent={canPostClubEvents ? openPostEvent : undefined} />;
  else if (activePage === 'class') currentPage = <ClassPage roleMode={roleMode} classUpdates={classUpdates} unreadClassUpdateIds={unreadClassUpdateIds} completedTasks={completedClassTasks} onToggleTask={toggleClassTask} onPostUpdate={openPostClassUpdate} onRemoveUpdate={removeClassUpdate} onMarkUpdatesRead={markAllClassUpdatesRead} />;
  else if (activePage === 'directory') currentPage = <DirectoryPage />;
  else if (activePage === 'announcements') currentPage = <AnnouncementsPage readAnnouncements={readAnnouncements} onReadNotice={setNoticeRead} onAllRead={markAllRead} onOpenNotice={(item, origin) => showModal({ type: 'notice', item, origin })} />;
  else currentPage = <OverviewPage navigate={navigate} onOpenEvent={openEvent} onOpenNotice={openNotice} registeredEvents={registeredEvents} readAnnouncements={readAnnouncements} eventList={eventList} unreadClassUpdates={unreadClassUpdates} />;

  const hasLiveCardOrigin = Boolean(modal?.origin?.element?.isConnected);
  const isOriginModalClosing = Boolean(isModalClosing && modal?.origin && typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function');
  const usesSharedCardExpansion = Boolean(hasLiveCardOrigin && ['event', 'club', 'notice'].includes(modal?.type));

  return (
    <div className={`app-shell${isModalClosing ? ' app-shell-modal-closing' : ''}${isOriginModalClosing ? ' app-shell-modal-origin-closing' : ''}${usesSharedCardExpansion ? ' app-shell-modal-origin-active' : ''}`}>
      <Sidebar activePage={activePage} navigate={navigate} unreadCount={unreadCount} unreadClassUpdateCount={unreadClassUpdates.length} isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} onFeedback={openFeedback} eventList={eventList} registeredEvents={registeredEvents} clubsJoined={clubsJoined} roleMode={roleMode} onRoleChange={setRoleMode} onOpenEvent={openEvent} onOpenClub={openClub} />
      <div className="workspace">
        <Topbar
          activePage={activePage}
          roleMode={roleMode}
          unreadCount={notificationCount}
          onNotifications={() => setIsNotificationsOpen((current) => !current)}
          isNotificationsOpen={isNotificationsOpen}
          onMobileMenu={() => setIsMobileNavOpen(true)}
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchResults={searchResults}
          onSearchResult={chooseSearchResult}
          searchRef={searchWrapRef}
        />
        {isNotificationsOpen && <NotificationPanel unreadCount={unreadCount} unreadClassUpdates={unreadClassUpdates} readAnnouncements={readAnnouncements} onOpenNotice={openNotice} onOpenClass={() => navigate('class')} onAllRead={markAllNotificationsRead} />}
        <main className="main-content" id="main-content">
          <div className="main-content-inner">
            <div className="page-transition" key={activePage === 'class' ? `${activePage}-${roleMode}` : activePage}>{currentPage}</div>
          </div>
        </main>
      </div>

      {usesSharedCardExpansion && <OriginCardExpansion modal={modal} onClose={closeModal} isClosing={isModalClosing} isRegistered={registeredEvents.has(modal.item.id)} onRegister={toggleRegistration} showToast={showToast} />}
      {modal?.type === 'event' && !usesSharedCardExpansion && <EventModal event={modal.item} isRegistered={registeredEvents.has(modal.item.id)} onRegister={toggleRegistration} onClose={closeModal} showToast={showToast} />}
      {modal?.type === 'club' && !usesSharedCardExpansion && <ClubModal club={modal.item} joined={clubsJoined.has(modal.item.id)} onToggle={toggleClub} onClose={closeModal} showToast={showToast} />}
      {modal?.type === 'notice' && !usesSharedCardExpansion && <NoticeModal item={modal.item} onClose={closeModal} />}
      {modal?.type === 'feedback' && <FeedbackModal onClose={closeModal} showToast={showToast} />}
      {modal?.type === 'post-event' && <PostClubEventModal onClose={closeModal} onPublish={publishClubEvent} />}
      {modal?.type === 'class-update' && <PostClassUpdateModal onClose={closeModal} onPublish={publishClassUpdate} />}
      {!modal && activeEventNotice && <PostedEventPopup event={activeEventNotice} onDismiss={() => dismissEventNotice(activeEventNotice.id)} />}

      {toast && <div className={`toast-message${activeEventNotice ? ' toast-message-with-event' : ''}`} role="status"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
    </div>
  );
}

export default App;
