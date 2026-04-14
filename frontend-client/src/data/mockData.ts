import type {
  User, Video, HistoryItem, Playlist,
  Attachment, AISummary, TranscriptEntry, Session
} from '../types';

// ============================
// Current User
// ============================
export const currentUser: User = {
  id: 'u1',
  fullName: 'Elena Rodriguez',
  email: 'elena.rodriguez@waypoint.com',
  avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Elena',
  role: 'USER',
  title: 'Senior Project Manager',
  department: 'Operations',
  videosViewed: 1248,
  certifications: 9,
};

// ============================
// Placeholder thumbnail helper
// ============================
const thumb = (seed: string) =>
  `https://picsum.photos/seed/${seed}/640/360`;

const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;

// ============================
// Videos
// ============================
export const featuredVideo: Video = {
  id: 'v-featured',
  title: 'Q4 Vision & Global Expansion Strategy',
  description:
    "Join our CEO and executive leadership team as they unveil the roadmap for next year's market disruption and product evolution.",
  thumbnailUrl: thumb('q4vision'),
  status: 'READY',
  metadata: { duration: 3420 },
  viewCount: 12400,
  _count: { likes: 892, comments: 54 },
  createdAt: '2024-10-28T10:00:00Z',
  creator: { id: 'ch1', fullName: 'Executive Office', avatarUrl: avatar('ExecOffice') },
  category: 'Townhall',
  visibility: 'ORG',
};

export const discoveryVideos: Video[] = [
  {
    id: 'v1',
    title: 'Design Systems for Enterprise',
    description: 'Master the art of creating scalable UI components that drive consistency across global teams.',
    thumbnailUrl: thumb('designsystems'),
    status: 'READY',
    metadata: { duration: 2580 },
    viewCount: 3400,
    _count: { likes: 245, comments: 18 },
    createdAt: '2024-10-25T14:00:00Z',
    creator: { id: 'ch2', fullName: 'UX Research Team', avatarUrl: avatar('UXTeam') },
    category: 'Training',
    visibility: 'ORG',
  },
  {
    id: 'v2',
    title: 'New AI Workflow Standards',
    description: 'How AI is transforming enterprise operations and productivity.',
    thumbnailUrl: thumb('aiworkflow'),
    status: 'READY',
    metadata: { duration: 1920 },
    viewCount: 5600,
    _count: { likes: 412, comments: 33 },
    createdAt: '2024-10-24T09:00:00Z',
    creator: { id: 'ch3', fullName: 'Tech Division', avatarUrl: avatar('TechDiv') },
    category: 'Training',
    visibility: 'ORG',
  },
  {
    id: 'v3',
    title: 'Leadership Mindset Shift',
    description: 'Transform your approach to leading distributed teams across time zones.',
    thumbnailUrl: thumb('leadership'),
    status: 'READY',
    metadata: { duration: 2700 },
    viewCount: 2100,
    _count: { likes: 187, comments: 12 },
    createdAt: '2024-10-23T11:00:00Z',
    creator: { id: 'ch4', fullName: 'HR & Culture', avatarUrl: avatar('HRCulture') },
    category: 'Training',
    visibility: 'ORG',
  },
  {
    id: 'v4',
    title: 'Migrating to Cloud Native',
    description: 'Understanding the architectural shifts required for massive horizontal scalability.',
    thumbnailUrl: thumb('cloudnative'),
    status: 'READY',
    metadata: { duration: 3180 },
    viewCount: 4200,
    _count: { likes: 356, comments: 27 },
    createdAt: '2024-10-22T16:00:00Z',
    creator: { id: 'ch3', fullName: 'Tech Division', avatarUrl: avatar('TechDiv') },
    category: 'Training',
    visibility: 'ORG',
  },
];

export const recentUploads: Video[] = [
  {
    id: 'v5',
    title: 'Mobile First: Design Systems',
    description: 'Creating responsive design systems that work across all platforms.',
    thumbnailUrl: thumb('mobilefirst'),
    status: 'READY',
    metadata: { duration: 1440 },
    viewCount: 840,
    _count: { likes: 72, comments: 5 },
    createdAt: '2024-10-27T10:00:00Z',
    creator: { id: 'ch2', fullName: 'UX Research Team', avatarUrl: avatar('UXTeam') },
    category: 'Training',
    visibility: 'ORG',
  },
  {
    id: 'v6',
    title: 'Revenue Forecast FY25',
    description: 'Deep dive into the upcoming fiscal year projections and growth drivers.',
    thumbnailUrl: thumb('revenuefy25'),
    status: 'READY',
    metadata: { duration: 2100 },
    viewCount: 620,
    _count: { likes: 45, comments: 3 },
    createdAt: '2024-10-25T08:00:00Z',
    creator: { id: 'ch5', fullName: 'Finance Dept', avatarUrl: avatar('Finance') },
    category: 'Townhall',
    visibility: 'ORG',
  },
  {
    id: 'v7',
    title: 'Culture First: Remote Bonding',
    description: 'Activities and strategies for building team cohesion in a hybrid world.',
    thumbnailUrl: thumb('remotebonding'),
    status: 'READY',
    metadata: { duration: 1800 },
    viewCount: 990,
    _count: { likes: 103, comments: 8 },
    createdAt: '2024-10-21T14:00:00Z',
    creator: { id: 'ch4', fullName: 'HR & Culture', avatarUrl: avatar('HRCulture') },
    category: 'Townhall',
    visibility: 'ORG',
  },
  {
    id: 'v8',
    title: 'Security Audit Walkthrough',
    description: 'Best practices for internal security audits and compliance checks.',
    thumbnailUrl: thumb('securityaudit'),
    status: 'READY',
    metadata: { duration: 2400 },
    viewCount: 510,
    _count: { likes: 38, comments: 2 },
    createdAt: '2024-10-20T09:00:00Z',
    creator: { id: 'ch6', fullName: 'IT Security', avatarUrl: avatar('ITSec') },
    category: 'Training',
    visibility: 'ORG',
  },
];

// ============================
// Playlists (formerly Courses — grouping videos into learning paths)
// ============================
export const playlists: Playlist[] = [
  {
    id: 'pl1',
    userId: 'u1',
    name: 'Strategy 2024 Kickoff',
    isPrivate: false,
    createdAt: '2024-10-01T00:00:00Z',
    _count: { items: 8 },
  },
  {
    id: 'pl2',
    userId: 'u1',
    name: 'Compliance Essentials',
    isPrivate: false,
    createdAt: '2024-09-15T00:00:00Z',
    _count: { items: 12 },
  },
  {
    id: 'pl3',
    userId: 'u1',
    name: 'My Learning Path',
    isPrivate: true,
    createdAt: '2024-10-10T00:00:00Z',
    _count: { items: 5 },
  },
];

// ============================
// Watch History
// ============================
export const watchHistory: HistoryItem[] = [
  { id: 'h1', userId: 'u1', videoId: 'v1', lastSecond: 1858, watchedAt: '2024-10-28T18:00:00Z', video: discoveryVideos[0] },
  { id: 'h2', userId: 'u1', videoId: 'v2', lastSecond: 1920, watchedAt: '2024-10-28T15:00:00Z', video: discoveryVideos[1] },
  { id: 'h3', userId: 'u1', videoId: 'v5', lastSecond: 648,  watchedAt: '2024-10-27T20:00:00Z', video: recentUploads[0] },
  { id: 'h4', userId: 'u1', videoId: 'v7', lastSecond: 540,  watchedAt: '2024-10-27T10:00:00Z', video: recentUploads[2] },
  { id: 'h5', userId: 'u1', videoId: 'v4', lastSecond: 3180, watchedAt: '2024-10-26T14:00:00Z', video: discoveryVideos[3] },
  { id: 'h6', userId: 'u1', videoId: 'v8', lastSecond: 2112, watchedAt: '2024-10-25T11:00:00Z', video: recentUploads[3] },
];

// ============================
// Liked Videos (mock — will come from /api/videos/liked)
// ============================
export const likedVideos: (Video & { likedAt: string })[] = [
  { ...featuredVideo,       likedAt: '2024-10-28T12:00:00Z' },
  { ...discoveryVideos[1],  likedAt: '2024-10-27T09:00:00Z' },
  { ...discoveryVideos[2],  likedAt: '2024-10-25T16:00:00Z' },
  { ...recentUploads[0],    likedAt: '2024-10-24T11:00:00Z' },
  { ...recentUploads[2],    likedAt: '2024-10-22T08:00:00Z' },
];

// ============================
// Up Next Videos (watch page sidebar)
// ============================
export const upNextVideos: Video[] = [
  {
    id: 'v-up1',
    title: 'Quarterly Marketing Alignment & Brand Audit',
    description: 'Review of brand consistency and marketing performance metrics.',
    thumbnailUrl: thumb('marketing'),
    status: 'READY',
    metadata: { duration: 1860 },
    viewCount: 1200,
    _count: { likes: 89, comments: 6 },
    createdAt: '2024-10-27T10:00:00Z',
    creator: { id: 'ch7', fullName: 'Marketing Dept', avatarUrl: avatar('Marketing') },
    category: 'Townhall',
    visibility: 'ORG',
  },
  {
    id: 'v-up2',
    title: 'Engineering Sprint Review: Project Phoenix',
    description: 'Technical review of the latest sprint deliverables and roadmap updates.',
    thumbnailUrl: thumb('phoenix'),
    status: 'READY',
    metadata: { duration: 2400 },
    viewCount: 860,
    _count: { likes: 67, comments: 4 },
    createdAt: '2024-10-24T14:00:00Z',
    creator: { id: 'ch8', fullName: 'Product Dev', avatarUrl: avatar('ProductDev') },
    category: 'Townhall',
    visibility: 'ORG',
  },
];

// ============================
// Watch Video Page — AI Summary & Transcript
// ============================
export const sampleAISummary: AISummary = {
  keyTakeaways: [
    { order: 1, text: 'Increased focus on modular logistics for Q4, aiming for a 15% reduction in cross-border delays.' },
    { order: 2, text: 'New internal training paths for Project Managers starting in November via the "WayPoint Academy".' },
    { order: 3, text: 'Budget re-allocation to R&D confirmed for the upcoming Fiscal Year.' },
  ],
  sentimentAnalysis:
    'The speaker maintains a high-energy tone during the regional expansion slides, suggesting confidence in the Q4 roadmap.',
  requiredActions: [
    'Review updated logistics KPIs by Nov 15',
    'Enroll in WayPoint Academy before Dec 1',
    'Submit R&D budget proposals by Oct 31',
  ],
};

export const sampleTranscript: TranscriptEntry[] = [
  {
    speaker: 'Elena Rodriguez',
    text: "Good morning everyone, and welcome to our Q4 Global Townhall. I know we have teams calling in from Singapore, London, and San Francisco today, so it's great to see this global representation.",
    timestamp: 0,
  },
  {
    speaker: 'Elena Rodriguez',
    text: "Let's dive straight into the operational changes. As you can see on the slide, we are moving towards a more modular approach to our logistics chain. This isn't just about speed; it's about resilience.",
    timestamp: 45,
  },
  {
    speaker: 'Elena Rodriguez',
    text: 'Many of you have asked about the budget re-allocation for R&D. I want to confirm that we are doubling down on our core technologies. The innovation lab will receive an additional 20% funding starting Q1 of next year.',
    timestamp: 120,
  },
  {
    speaker: 'Elena Rodriguez',
    text: "Finally, the new WayPoint Academy. This is a platform for you. Training paths will be curated by department heads to ensure we're all speaking the same technical language.",
    timestamp: 210,
  },
];

export const sampleAttachments: Attachment[] = [
  { id: 'a1', name: 'Q4_Strategy_Final.pdf', type: 'pdf', size: '12.4 MB', url: '#' },
  { id: 'a2', name: 'Global_Logistics_Data.xlsx', type: 'xls', size: '4.1 MB', url: '#' },
];

// ============================
// Settings — Sessions
// ============================
export const activeSessions: Session[] = [
  { id: 's1', device: 'MacBook Pro 16"', location: 'San Francisco, USA', lastActive: 'Current Session', isCurrent: true },
  { id: 's2', device: 'iPhone 15 Pro', location: 'London, UK', lastActive: '2 hours ago', isCurrent: false },
];

// ============================
// Activity Feed (local interface — not backed by API)
// ============================
export interface ActivityItem {
  id: string;
  type: 'completed' | 'watched' | 'created' | 'replied';
  title: string;
  subtitle: string;
  timeAgo: string;
}

export const activityFeed: ActivityItem[] = [
  { id: 'act1', type: 'completed', title: 'Completed Cybersecurity 101', subtitle: 'Earned Certificate of Excellence', timeAgo: '2 hours ago' },
  { id: 'act2', type: 'watched',   title: 'Watched Q4 Townhall',         subtitle: 'Left a comment on slide 14',      timeAgo: 'Yesterday' },
  { id: 'act3', type: 'created',   title: 'Created New Playlist',         subtitle: 'Added "Leadership 101" series',   timeAgo: '3 days ago' },
  { id: 'act4', type: 'replied',   title: 'Reply in Engineering Forum',   subtitle: 'Regarding "API Documentation" video', timeAgo: '5 days ago' },
];
