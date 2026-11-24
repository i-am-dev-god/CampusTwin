import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { announcements, clubs, directory, events, pageLabels } from './data.js';

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

function Sidebar({ activePage, navigate, unreadCount, isOpen, onClose, onFeedback }) {
  return (
    <>
      {isOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand-row">
          <div className="brand-lockup">
            <BrandMark />
            <span className="brand-wordmark">campus<span>twin</span></span>
          </div>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>

        <div className="campus-switcher">
          <span className="campus-switcher-icon"><Building2 size={17} /></span>
          <span className="campus-switcher-copy"><strong>Student portal</strong><small>Campus services & activities</small></span>
          <ChevronDown size={15} className="campus-switcher-chevron" />
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
                  {activePage === id && <span className="nav-active-mark" />}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="sidebar-tip-icon"><Sparkles size={16} /></div>
            <p>Review upcoming events and official campus updates.</p>
            <button onClick={() => navigate('events')}>View upcoming events <ArrowRight size={13} /></button>
          </div>
          <button className="sidebar-help" onClick={onFeedback}>
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

function Topbar({ activePage, unreadCount, onNotifications, isNotificationsOpen, onMobileMenu, searchValue, setSearchValue, searchOpen, setSearchOpen, searchResults, onSearchResult, searchRef }) {
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
        <div className="topbar-page-label"><span>STUDENT PORTAL</span><strong>{pageLabels[activePage] || 'Dashboard'}</strong></div>
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
        <span className="sample-badge"><span /> SAMPLE DATA</span>
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

function NotificationPanel({ unreadCount, readAnnouncements, onOpenNotice, onAllRead }) {
  return (
    <div className="notification-popover notification-popover-content">
      <div className="notification-popover-head">
        <div><strong>Announcements</strong><span>{unreadCount ? `${unreadCount} unread notices` : 'No unread notices'}</span></div>
        {unreadCount > 0 && <button onClick={onAllRead}>Mark all read</button>}
      </div>
      <div className="notification-list">
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

function OverviewPage({ navigate, onOpenEvent, onOpenNotice, registeredEvents, readAnnouncements }) {
  const date = getDateParts(0);
  const unreadCount = announcements.filter((item) => !readAnnouncements.has(item.id)).length;
  const shortcuts = [
    { title: 'Events & RSVP', detail: 'View scheduled activities', icon: 'CalendarDays', tone: 'quick-cyan', page: 'events' },
    { title: 'Clubs & communities', detail: 'Browse student groups', icon: 'UsersRound', tone: 'quick-violet', page: 'clubs' },
    { title: 'People & services', detail: 'Find contacts and services', icon: 'ContactRound', tone: 'quick-lime', page: 'directory' },
    { title: 'Announcements', detail: 'Read official updates', icon: 'Megaphone', tone: 'quick-pink', page: 'announcements' },
  ];

  return (
    <div className="page-stack overview-page">
      <div className="page-intro overview-intro">
        <div>
          <div className="eyebrow"><span className="eyebrow-live-dot" />{date.full.toUpperCase()} <span className="eyebrow-divider">/</span> CAMPUS DASHBOARD</div>
          <h1>Welcome back, Aanya</h1>
          <p>Access events, student groups, and campus services.</p>
        </div>
      </div>

      <section className="dashboard-shortcut-section" aria-label="Quick access shortcuts">
        <div className="section-heading shortcuts-heading">
          <div><p className="section-overline">PORTAL SHORTCUTS</p><h2>Quick access</h2></div>
          <span className="shortcuts-pinned"><Star size={13} /> Pinned shortcuts</span>
        </div>
        <div className="quick-actions dashboard-shortcuts">
          {shortcuts.map((shortcut) => (
            <button className="quick-action" key={shortcut.page} onClick={() => navigate(shortcut.page)}>
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
            <div><p className="section-overline">CAMPUS CALENDAR</p><h2>Upcoming events <span className="heading-count">03</span></h2></div>
            <button className="text-button" onClick={() => navigate('events')}>View all <ArrowRight size={15} /></button>
          </div>
          <div className="upcoming-list">
            {events.slice(0, 3).map((item) => <UpcomingEvent key={item.id} event={item} onClick={() => onOpenEvent(item)} registered={registeredEvents.has(item.id)} />)}
          </div>
          <button className="panel-footer-link" onClick={() => navigate('events')}>View all events <ArrowRight size={15} /></button>
        </section>

        <section className="surface-card bulletin-panel">
          <div className="section-heading">
            <div><p className="section-overline">OFFICIAL ANNOUNCEMENTS</p><h2>Announcements {unreadCount > 0 && <span className="new-indicator">{unreadCount} UNREAD</span>}</h2></div>
            <button className="icon-button subtle-icon-button" onClick={() => navigate('announcements')} aria-label="View all announcements"><ArrowUpRight size={16} /></button>
          </div>
          <div className="bulletin-list">
            {announcements.slice(0, 3).map((item) => <BulletinItem key={item.id} item={item} onClick={() => onOpenNotice(item)} />)}
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
    <article className="upcoming-event">
      <div className={`date-tile tone-${event.color}`}><span>{date.month}</span><strong>{date.day}</strong><small>{getEventDayLabel(event.dayOffset)}</small></div>
      <div className="upcoming-event-copy">
        <div className="event-meta-line"><span className={`event-category-dot dot-${event.color}`} />{event.category}<span className="meta-divider">·</span>{event.time}</div>
        <button className="upcoming-event-title" onClick={onClick}>{event.title}</button>
        <div className="upcoming-event-venue"><Building2 size={13} /> {event.venue}</div>
      </div>
      {registered && <span className="registered-mini" title="You’re registered"><Check size={13} /></span>}
      <button className="upcoming-event-open" onClick={onClick} aria-label={`View ${event.title}`}><ChevronRight size={17} /></button>
    </article>
  );
}

function BulletinItem({ item, onClick }) {
  return (
    <button className="bulletin-item" onClick={onClick}>
      <span className={`bulletin-symbol tone-${item.color}`}><Icon name={item.icon} size={16} /></span>
      <span className="bulletin-copy"><span className="bulletin-meta">{item.category}<i />{item.time.split('·')[0].trim()}</span><strong>{item.title}</strong><small>{item.author}</small></span>
      <ArrowUpRight size={15} className="bulletin-arrow" />
    </button>
  );
}

function EventsPage({ onOpenEvent, registeredEvents }) {
  const [activeFilter, setActiveFilter] = useState('All events');
  const filters = ['All events', 'Workshops', 'Talks', 'Hackathons', 'Culture & community'];
  const filteredEvents = events.filter((event) => {
    if (activeFilter === 'All events') return true;
    if (activeFilter === 'Culture & community') return ['culture', 'community'].includes(event.category.toLowerCase());
    return event.category.toLowerCase() === activeFilter.replace(/s$/, '').toLowerCase();
  });
  const eventCount = events.filter((event) => event.dayOffset < 7).length;

  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="STUDENT PORTAL / EVENTS"
        title="Events & activities"
        description="Browse upcoming campus events, workshops, talks, and student activities."
        action={<span className="intro-chip"><CalendarDays size={14} /> {eventCount} events this week</span>}
      />
      <div className="section-toolbar events-toolbar">
        <div><p className="section-overline">CAMPUS CALENDAR</p><h2>Upcoming events <span className="heading-count">{String(filteredEvents.length).padStart(2, '0')}</span></h2></div>
        <div className="filter-pills" role="group" aria-label="Filter events">
          {filters.map((filter) => <button key={filter} className={`filter-pill${activeFilter === filter ? ' filter-pill-active' : ''}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
        </div>
      </div>
      <div className="event-page-grid">
        {filteredEvents.map((event) => <EventCard key={event.id} event={event} onOpen={() => onOpenEvent(event)} registered={registeredEvents.has(event.id)} />)}
        {filteredEvents.length === 0 && <EmptyState title="No events found" copy="Try another category or check back later." />}
      </div>
      <div className="page-note"><ShieldCheck size={15} /><span>Event dates and venues are sample data. Use your institution’s verified event feed before launch.</span></div>
    </div>
  );
}

function EventCard({ event, onOpen, registered }) {
  const date = getDateParts(event.dayOffset);
  return (
    <article className={`event-card event-card-${event.color}`}>
      <div className="event-card-heading">
        <span className={`event-card-symbol tone-${event.color}`}><Icon name={event.icon} size={18} /></span>
        <span className={`category-pill category-${event.color}`}>{event.category}</span>
        <span className="event-date-summary">{date.month} {date.day}</span>
      </div>
      <div className="event-card-content">
        <div className="event-day-label">{getEventDayLabel(event.dayOffset)} · {event.time}</div>
        <button className="event-card-title" onClick={onOpen}>{event.title}</button>
        <p>{event.summary}</p>
        <div className="event-card-details"><span><Building2 size={14} />{event.venue}</span><span><UsersRound size={14} />{event.host}</span></div>
        <div className="event-card-footer"><span className="event-seat-label"><span className="seat-indicator" />{event.seats}</span><button className={`button button-small${registered ? ' button-registered' : ' button-dark'}`} onClick={onOpen}>{registered ? <><Check size={14} /> Registered</> : <>View details <ArrowRight size={14} /></>}</button></div>
      </div>
    </article>
  );
}

function ClubsPage({ clubsJoined, onToggleClub, onOpenClub }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All groups');
  const categories = ['All groups', 'Technology', 'Arts & culture', 'Ideas & debate', 'Environment', 'Music'];
  const filteredClubs = clubs.filter((club) => {
    const matchesCategory = activeCategory === 'All groups' || club.category === activeCategory;
    const query = searchTerm.trim().toLowerCase();
    const matchesQuery = !query || `${club.name} ${club.category} ${club.description}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="page-stack">
      <PageIntro eyebrow="STUDENT PORTAL / STUDENT GROUPS" title="Clubs & student groups" description="Browse student-led clubs, interests, and upcoming activities." action={<span className="intro-chip"><UsersRound size={14} /> {clubs.length} groups</span>} />
      <div className="directory-toolbar">
        <div className="filter-pills filter-pills-wrap" role="group" aria-label="Filter clubs">
          {categories.map((category) => <button key={category} className={`filter-pill${activeCategory === category ? ' filter-pill-active' : ''}`} onClick={() => setActiveCategory(category)}>{category}</button>)}
        </div>
        <label className="inline-search"><Search size={16} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search student groups" aria-label="Search student groups" />{searchTerm && <button onClick={() => setSearchTerm('')} aria-label="Clear group search"><X size={14} /></button>}</label>
      </div>
      <div className="club-grid">
        {filteredClubs.map((club) => <ClubCard key={club.id} club={club} joined={clubsJoined.has(club.id)} onToggle={() => onToggleClub(club)} onOpen={() => onOpenClub(club)} />)}
        {filteredClubs.length === 0 && <EmptyState title="No student groups found" copy="Try a different search or category." />}
      </div>
      <div className="club-callout"><span className="club-callout-icon"><Lightbulb size={17} /></span><span><strong>Propose a new student group</strong><small>Submit an idea for review by the Student Life team.</small></span><button onClick={() => onOpenClub({ id: 'new-club', name: 'Propose a student group', category: 'Student group proposal', description: 'Submit a group idea for review by the Student Life team. Include the purpose of the group and the activities you would like to organise.', members: 0, next: 'Proposals are reviewed by Student Life', icon: 'Lightbulb', color: 'lime', initials: 'NEW' })}>Submit proposal <ArrowRight size={14} /></button></div>
    </div>
  );
}

function ClubCard({ club, joined, onToggle, onOpen }) {
  return (
    <article className={`club-card club-card-${club.color}`}>
      <div className="club-card-top"><span className={`club-mark tone-${club.color}`}><Icon name={club.icon} size={22} /></span><span className="club-members"><UsersRound size={13} />{club.members}</span></div>
      <span className="club-category">{club.category}</span>
      <button className="club-card-title" onClick={onOpen}>{club.name}<ArrowUpRight size={15} /></button>
      <p>{club.description}</p>
      <div className="club-next"><span className="club-next-dot" /><span><small>NEXT MEETING</small><strong>{club.next}</strong></span></div>
      <div className="club-card-footer"><button className="club-details-link" onClick={onOpen}>View group details <ArrowRight size={14} /></button><button className={`button button-small${joined ? ' button-joined' : ' button-light'}`} onClick={onToggle}>{joined ? <><Check size={14} /> Joined</> : <>Join group <PlusIcon /></>}</button></div>
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
      <PageIntro eyebrow="STUDENT PORTAL / DIRECTORY" title="Campus directory" description="Search academic departments, staff contacts, and student services." action={<span className="intro-chip"><ContactRound size={14} /> {directory.length} listings</span>} />
      <section className="directory-welcome">
        <div className="directory-welcome-icon"><ContactRound size={21} /></div>
        <div><span>PEOPLE AND SERVICES</span><h2>Campus contacts and resources</h2><p>Browse contact details, service information, office hours, and academic listings.</p></div>
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
      <div className="page-note"><ShieldCheck size={15} /><span>Directory entries and contact details are examples. Replace them with verified, approved campus information.</span></div>
    </div>
  );
}

function AnnouncementsPage({ readAnnouncements, onReadNotice, onAllRead, onOpenNotice }) {
  const unreadCount = announcements.filter((item) => !readAnnouncements.has(item.id)).length;
  return (
    <div className="page-stack">
      <PageIntro
        eyebrow="STUDENT PORTAL / ANNOUNCEMENTS"
        title="Notices & announcements"
        description="Official updates from campus departments, student services, and student groups."
        action={unreadCount > 0 ? <button className="button button-outline" onClick={onAllRead}><CheckCheck size={16} /> Mark all as read</button> : <span className="intro-chip"><Check size={14} /> All notices read</span>}
      />
      <div className="section-toolbar bulletin-toolbar">
        <div><p className="section-overline">RECENT UPDATES</p><h2>All announcements <span className="heading-count">{String(announcements.length).padStart(2, '0')}</span></h2></div>
        <span className="bulletin-sort"><Activity size={15} /> Most recent</span>
      </div>
      <div className="announcement-feed">
        {announcements.map((item) => <AnnouncementCard key={item.id} item={item} isRead={readAnnouncements.has(item.id)} onClick={() => { onReadNotice(item.id); onOpenNotice(item); }} />)}
      </div>
      <div className="page-note"><ShieldCheck size={15} /><span>These notices are sample data. Connect an approved campus source before launch.</span></div>
    </div>
  );
}

function AnnouncementCard({ item, isRead, onClick }) {
  return (
    <article className={`announcement-card${isRead ? '' : ' announcement-unread'}`}>
      <span className={`announcement-icon tone-${item.color}`}><Icon name={item.icon} size={19} /></span>
      <div className="announcement-card-content"><div className="announcement-meta"><span>{item.category}</span><i />{item.time}<i />Posted by {item.author}</div><button onClick={onClick} className="announcement-title">{item.title}</button><p>{item.body}</p></div>
      {!isRead && <span className="announcement-new">UNREAD</span>}
      <button className="announcement-open" onClick={onClick} aria-label={`Read ${item.title}`}><ArrowUpRight size={16} /></button>
    </article>
  );
}

function PageIntro({ eyebrow, title, description, action }) {
  return (
    <div className="page-intro">
      <div><div className="eyebrow"><span className="eyebrow-live-dot" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {action && <div className="page-intro-action">{action}</div>}
    </div>
  );
}

function EmptyState({ title, copy }) {
  return <div className="empty-state"><span><Search size={19} /></span><strong>{title}</strong><p>{copy}</p></div>;
}

function EventModal({ event, isRegistered, onRegister, onClose, showToast }) {
  const date = getDateParts(event.dayOffset);
  return (
    <Modal onClose={onClose}>
      <div className={`modal-banner modal-banner-${event.color}`}><span className="modal-banner-icon"><Icon name={event.icon} size={27} /></span><span className="category-pill category-pill-light">{event.category}</span><span className="modal-banner-date"><b>{date.day}</b><small>{date.month}</small></span></div>
      <div className="modal-main"><div className="modal-eyebrow">{getEventDayLabel(event.dayOffset)} · {event.duration}</div><h2>{event.title}</h2><p className="modal-description">{event.summary}</p>
        <div className="modal-facts"><div><span className="modal-fact-icon"><CalendarDays size={16} /></span><span><small>WHEN</small><strong>{date.full} · {event.time}</strong></span></div><div><span className="modal-fact-icon"><Building2 size={16} /></span><span><small>WHERE</small><strong>{event.venue}</strong></span></div><div><span className="modal-fact-icon"><UsersRound size={16} /></span><span><small>HOSTED BY</small><strong>{event.host}</strong></span></div></div>
        <div className="modal-footer"><span className="modal-seat"><span className="seat-indicator" />{event.seats}</span><button className={`button${isRegistered ? ' button-registered' : ' button-lime'}`} onClick={() => { if (isRegistered) { showToast('You are already registered for this event.'); return; } onRegister(event); showToast('Registration saved in this demo.'); }}>{isRegistered ? <><Check size={16} /> Registered</> : <>Register for event <ArrowRight size={15} /></>}</button></div>
      </div>
    </Modal>
  );
}

function ClubModal({ club, joined, onToggle, onClose, showToast }) {
  return (
    <Modal onClose={onClose}>
      <div className={`club-modal-cover club-modal-cover-${club.color || 'lime'}`}><span className="club-modal-symbol"><Icon name={club.icon || 'Lightbulb'} size={29} /></span><span className="club-modal-mark">STUDENT GROUP DETAILS</span><span className="club-modal-stars">✳</span></div>
      <div className="modal-main"><div className="modal-eyebrow">{club.category} <i /> {club.members ? `${club.members} MEMBERS` : 'SUBMIT A PROPOSAL'}</div><h2>{club.name}</h2><p className="modal-description">{club.description}</p><div className="club-modal-next"><span className="club-next-dot" /><span><small>NEXT MEETING</small><strong>{club.next}</strong></span></div><div className="modal-footer"><span className="modal-seat"><UsersRound size={15} />{club.members ? `${club.members} members` : 'Submit a group proposal for review'}</span><button className={`button${joined ? ' button-registered' : ' button-lime'}`} onClick={() => { onToggle(club); if (!joined && club.id !== 'new-club') showToast(`Your membership status for ${club.name} was updated.`); }}>{joined ? <><Check size={16} /> Joined</> : <>{club.id === 'new-club' ? 'Submit proposal' : 'Join group'} <ArrowRight size={15} /></>}</button></div></div>
    </Modal>
  );
}

function NoticeModal({ item, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className={`notice-modal-mark tone-${item.color}`}><Icon name={item.icon} size={22} /></div>
      <div className="modal-main notice-modal-main"><div className="modal-eyebrow">{item.category} <i /> {item.time}</div><h2>{item.title}</h2><p className="modal-description notice-modal-body">{item.body}</p><div className="notice-author"><span className="notice-author-avatar"><Icon name={item.icon} size={15} /></span><span><small>POSTED BY</small><strong>{item.author}</strong></span></div><div className="modal-footer"><span className="modal-seat">Campus announcement <span className="tiny-divider" /> Sample data</span><button className="button button-dark" onClick={onClose}>Close <Check size={15} /></button></div></div>
    </Modal>
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

function Modal({ children, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-shell" role="dialog" aria-modal="true">
        <button className="modal-close icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        {children}
      </section>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [clubsJoined, setClubsJoined] = useStoredSet('campustwin-joined-clubs', ['first-principles']);
  const [registeredEvents, setRegisteredEvents] = useStoredSet('campustwin-registered-events', []);
  const [readAnnouncements, setReadAnnouncements] = useStoredSet('campustwin-read-notices', ['open-studio']);
  const searchWrapRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const unreadCount = announcements.filter((item) => !readAnnouncements.has(item.id)).length;
  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return [];
    const allResults = [
      ...events.map((item) => ({ id: item.id, title: item.title, detail: item.summary, type: 'event', typeLabel: `Event · ${item.category}`, icon: item.icon, color: item.color, item })),
      ...clubs.map((item) => ({ id: item.id, title: item.name, detail: `${item.category} ${item.description}`, type: 'club', typeLabel: `Community · ${item.category}`, icon: item.icon, color: item.color, item })),
      ...directory.map((item) => ({ id: item.id, title: item.name, detail: `${item.category} ${item.detail}`, type: 'directory', typeLabel: `Directory · ${item.category}`, icon: item.icon, color: item.color, item })),
      ...announcements.map((item) => ({ id: item.id, title: item.title, detail: `${item.category} ${item.body}`, type: 'notice', typeLabel: `Announcement · ${item.category}`, icon: item.icon, color: item.color, item })),
    ];
    return allResults.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(query)).slice(0, 6);
  }, [searchValue]);

  const showToast = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(''), 3400);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimeoutRef.current), []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = useCallback((page) => {
    setActivePage(page);
    setIsMobileNavOpen(false);
    setIsNotificationsOpen(false);
    setSearchOpen(false);
    setSearchValue('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const setNoticeRead = useCallback((id) => {
    setReadAnnouncements((current) => new Set([...current, id]));
  }, [setReadAnnouncements]);

  const markAllRead = useCallback(() => {
    setReadAnnouncements(new Set(announcements.map((item) => item.id)));
    showToast('All announcements have been marked as read.');
  }, [setReadAnnouncements, showToast]);

  const toggleRegistration = useCallback((event) => {
    setRegisteredEvents((current) => {
      const next = new Set(current);
      if (next.has(event.id)) next.delete(event.id);
      else next.add(event.id);
      return next;
    });
  }, [setRegisteredEvents]);

  const toggleClub = useCallback((club) => {
    if (club.id === 'new-club') {
      setModal({ type: 'feedback' });
      return;
    }
    setClubsJoined((current) => {
      const next = new Set(current);
      if (next.has(club.id)) next.delete(club.id);
      else next.add(club.id);
      return next;
    });
  }, [setClubsJoined]);

  const openNotice = useCallback((item) => {
    setIsNotificationsOpen(false);
    if (!item) {
      navigate('announcements');
      return;
    }
    setNoticeRead(item.id);
    setModal({ type: 'notice', item });
  }, [navigate, setNoticeRead]);

  const chooseSearchResult = useCallback((result) => {
    setSearchOpen(false);
    setSearchValue('');
    setActivePage(result.type === 'notice' ? 'announcements' : result.type === 'event' ? 'events' : result.type === 'club' ? 'clubs' : 'directory');
    setIsMobileNavOpen(false);
    if (result.type === 'event') setModal({ type: 'event', item: result.item });
    if (result.type === 'club') setModal({ type: 'club', item: result.item });
    if (result.type === 'notice') {
      setNoticeRead(result.id);
      setModal({ type: 'notice', item: result.item });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setNoticeRead]);

  const openFeedback = useCallback(() => setModal({ type: 'feedback' }), []);
  const openEvent = useCallback((event) => setModal({ type: 'event', item: event }), []);
  const openClub = useCallback((club) => setModal({ type: 'club', item: club }), []);
  const closeModal = useCallback(() => setModal(null), []);

  let currentPage;
  if (activePage === 'events') currentPage = <EventsPage onOpenEvent={openEvent} registeredEvents={registeredEvents} />;
  else if (activePage === 'clubs') currentPage = <ClubsPage clubsJoined={clubsJoined} onToggleClub={(club) => { const wasJoined = clubsJoined.has(club.id); toggleClub(club); if (!wasJoined) showToast(`Your membership status for ${club.name} was updated.`); }} onOpenClub={openClub} />;
  else if (activePage === 'directory') currentPage = <DirectoryPage />;
  else if (activePage === 'announcements') currentPage = <AnnouncementsPage readAnnouncements={readAnnouncements} onReadNotice={setNoticeRead} onAllRead={markAllRead} onOpenNotice={(item) => setModal({ type: 'notice', item })} />;
  else currentPage = <OverviewPage navigate={navigate} onOpenEvent={openEvent} onOpenNotice={openNotice} registeredEvents={registeredEvents} readAnnouncements={readAnnouncements} />;

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} navigate={navigate} unreadCount={unreadCount} isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} onFeedback={openFeedback} />
      <div className="workspace">
        <Topbar
          activePage={activePage}
          unreadCount={unreadCount}
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
        {isNotificationsOpen && <NotificationPanel unreadCount={unreadCount} readAnnouncements={readAnnouncements} onOpenNotice={openNotice} onAllRead={markAllRead} />}
        <main className="main-content" id="main-content">
          <div className="main-content-inner">{currentPage}</div>
        </main>
      </div>

      {modal?.type === 'event' && <EventModal event={modal.item} isRegistered={registeredEvents.has(modal.item.id)} onRegister={toggleRegistration} onClose={closeModal} showToast={showToast} />}
      {modal?.type === 'club' && <ClubModal club={modal.item} joined={clubsJoined.has(modal.item.id)} onToggle={toggleClub} onClose={closeModal} showToast={showToast} />}
      {modal?.type === 'notice' && <NoticeModal item={modal.item} onClose={closeModal} />}
      {modal?.type === 'feedback' && <FeedbackModal onClose={closeModal} showToast={showToast} />}

      {toast && <div className="toast-message" role="status"><span className="toast-check"><Check size={14} /></span>{toast}</div>}
    </div>
  );
}

export default App;
