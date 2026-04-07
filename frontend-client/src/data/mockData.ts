import type {
  User, Video, Course, Lesson, HistoryItem, Playlist,
  Attachment, AISummary, TranscriptEntry, Session
} from '../types';

// ============================
// Current User
// ============================
export const currentUser: User = {
  id: 'u1',
  name: 'Elena Rodriguez',
  email: 'elena.rodriguez@waypoint.com',
  avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Elena',
  role: 'viewer',
  title: 'Senior Project Manager',
  department: 'Operations',
  stats: {
    videosViewed: 1248,
    coursesCompleted: 42,
    certifications: 9,
  },
};

// ============================
// Placeholder thumbnail helper
// ============================
const thumb = (seed: string) =>
  `https://picsum.photos/seed/${seed}/640/360`;
const thumbPortrait = (seed: string) =>
  `https://picsum.photos/seed/${seed}/400/520`;
const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}`;

// ============================
// Videos
// ============================
export const featuredVideo: Video = {
  id: 'v-featured',
  title: 'Q4 Vision & Global Expansion Strategy',
  description:
    'Join our CEO and executive leadership team as they unveil the roadmap for next year\'s market disruption and product evolution.',
  thumbnailUrl: thumb('q4vision'),
  videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  duration: 3420,
  views: 12400,
  likes: 892,
  createdAt: '2024-10-28T10:00:00Z',
  channel: { id: 'ch1', name: 'Executive Office', avatar: avatar('ExecOffice') },
  category: 'Townhall',
  tags: ['strategy', 'leadership', 'Q4'],
};

export const discoveryVideos: Video[] = [
  {
    id: 'v1',
    title: 'Design Systems for Enterprise',
    description: 'Master the art of creating scalable UI components that drive consistency across global teams.',
    thumbnailUrl: thumb('designsystems'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 2580,
    views: 3400,
    likes: 245,
    createdAt: '2024-10-25T14:00:00Z',
    channel: { id: 'ch2', name: 'UX Research Team', avatar: avatar('UXTeam') },
    category: 'Training',
    tags: ['design', 'UI', 'systems'],
  },
  {
    id: 'v2',
    title: 'New AI Workflow Standards',
    description: 'How AI is transforming enterprise operations and productivity.',
    thumbnailUrl: thumb('aiworkflow'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 1920,
    views: 5600,
    likes: 412,
    createdAt: '2024-10-24T09:00:00Z',
    channel: { id: 'ch3', name: 'Tech Division', avatar: avatar('TechDiv') },
    category: 'Training',
    tags: ['AI', 'workflow', 'automation'],
  },
  {
    id: 'v3',
    title: 'Leadership Mindset Shift',
    description: 'Transform your approach to leading distributed teams across time zones.',
    thumbnailUrl: thumb('leadership'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 2700,
    views: 2100,
    likes: 187,
    createdAt: '2024-10-23T11:00:00Z',
    channel: { id: 'ch4', name: 'HR & Culture', avatar: avatar('HRCulture') },
    category: 'Training',
    tags: ['leadership', 'management'],
  },
  {
    id: 'v4',
    title: 'Migrating to Cloud Native',
    description: 'Understanding the architectural shifts required for massive horizontal scalability.',
    thumbnailUrl: thumb('cloudnative'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 3180,
    views: 4200,
    likes: 356,
    createdAt: '2024-10-22T16:00:00Z',
    channel: { id: 'ch3', name: 'Tech Division', avatar: avatar('TechDiv') },
    category: 'Training',
    tags: ['cloud', 'architecture', 'devops'],
  },
];

export const recentUploads: Video[] = [
  {
    id: 'v5',
    title: 'Mobile First: Design Systems',
    description: 'Creating responsive design systems that work across all platforms.',
    thumbnailUrl: thumb('mobilefirst'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 1440,
    views: 840,
    likes: 72,
    createdAt: '2024-10-27T10:00:00Z',
    channel: { id: 'ch2', name: 'UX Research Team', avatar: avatar('UXTeam') },
    category: 'Training',
    tags: ['mobile', 'design'],
  },
  {
    id: 'v6',
    title: 'Revenue Forecast FY25',
    description: 'Deep dive into the upcoming fiscal year projections and growth drivers.',
    thumbnailUrl: thumb('revenuefy25'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 2100,
    views: 620,
    likes: 45,
    createdAt: '2024-10-25T08:00:00Z',
    channel: { id: 'ch5', name: 'Finance Dept', avatar: avatar('Finance') },
    category: 'Townhall',
    tags: ['finance', 'forecast'],
  },
  {
    id: 'v7',
    title: 'Culture First: Remote Bonding',
    description: 'Activities and strategies for building team cohesion in a hybrid world.',
    thumbnailUrl: thumb('remotebonding'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 1800,
    views: 990,
    likes: 103,
    createdAt: '2024-10-21T14:00:00Z',
    channel: { id: 'ch4', name: 'HR & Culture', avatar: avatar('HRCulture') },
    category: 'Townhall',
    tags: ['culture', 'remote'],
  },
  {
    id: 'v8',
    title: 'Security Audit Walkthrough',
    description: 'Best practices for internal security audits and compliance checks.',
    thumbnailUrl: thumb('securityaudit'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 2400,
    views: 510,
    likes: 38,
    createdAt: '2024-10-20T09:00:00Z',
    channel: { id: 'ch6', name: 'IT Security', avatar: avatar('ITSec') },
    category: 'Training',
    tags: ['security', 'compliance'],
  },
];

// ============================
// Courses
// ============================
const architectureLessons: Lesson[] = [
  { id: 'l1', title: 'The Foundation of Scalability', duration: 1455, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 1, status: 'completed' },
  { id: 'l2', title: 'Distributed Systems Mapping', duration: 2528, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 2, status: 'in_progress' },
  { id: 'l3', title: 'Consistency and Availability Trade-offs', duration: 2325, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 3, status: 'available' },
  { id: 'l4', title: 'Modern Microservices Architecture', duration: 3320, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 4, status: 'available' },
  { id: 'l5', title: 'Fault Tolerance & Recovery', duration: 1872, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 5, status: 'locked' },
  { id: 'l6', title: 'Introduction to Global Logistics', duration: 750, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 6, status: 'locked' },
  { id: 'l7', title: 'Q4 Operations & Strategy', duration: 2700, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 7, status: 'locked' },
  { id: 'l8', title: 'Supply Chain Resilience Models', duration: 1095, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 8, status: 'locked' },
  { id: 'l9', title: 'Regional Expansion Tactics', duration: 1360, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 9, status: 'locked' },
  { id: 'l10', title: 'Performance Benchmarking', duration: 1680, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 10, status: 'locked' },
  { id: 'l11', title: 'Advanced Caching Strategies', duration: 2100, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 11, status: 'locked' },
  { id: 'l12', title: 'Capstone: Design a Distributed System', duration: 3600, videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', order: 12, status: 'locked' },
];

export const courses: Course[] = [
  {
    id: 'c1',
    title: 'Architectural Systems Design',
    description: 'A comprehensive deep-dive into the architectural decisions that power enterprise-grade systems.',
    thumbnailUrl: thumb('architecture'),
    instructor: {
      id: 'i1',
      name: 'Marcus Thorne',
      title: 'Principal Engineer @ WayPoint',
      avatar: avatar('Marcus'),
      bio: '"Architecture is not about making systems complex, but finding the simplest way to manage complexity."',
    },
    lessons: architectureLessons,
    totalDuration: 24685,
    enrolledCount: 1420,
    category: 'Engineering',
    progress: 12,
    status: 'in_progress',
  },
  {
    id: 'c2',
    title: 'Cloud Architecture & Scalability',
    description: 'Build and deploy globally scalable cloud infrastructure from day one.',
    thumbnailUrl: thumb('cloudarch'),
    instructor: { id: 'i2', name: 'Sarah Chen', title: 'Cloud Architect', avatar: avatar('Sarah'), bio: '' },
    lessons: [],
    totalDuration: 18000,
    enrolledCount: 980,
    category: 'Engineering',
    progress: 0,
    status: 'not_started',
  },
  {
    id: 'c3',
    title: 'Data-Driven Growth Strategies',
    description: 'Leverage analytics and data science to drive business outcomes.',
    thumbnailUrl: thumb('datagrowth'),
    instructor: { id: 'i3', name: 'James Liu', title: 'Head of Analytics', avatar: avatar('James'), bio: '' },
    lessons: [],
    totalDuration: 14400,
    enrolledCount: 760,
    category: 'Business',
    progress: 65,
    status: 'in_progress',
  },
  {
    id: 'c4',
    title: 'Visual Storytelling in Product',
    description: 'The art of communicating product vision through compelling visual narratives.',
    thumbnailUrl: thumb('visualstory'),
    instructor: { id: 'i4', name: 'Mia Foster', title: 'Design Director', avatar: avatar('Mia'), bio: '' },
    lessons: [],
    totalDuration: 10800,
    enrolledCount: 1100,
    category: 'Design',
    progress: 100,
    status: 'completed',
  },
  {
    id: 'c5',
    title: 'Empathetic Leadership for Teams',
    description: 'Build trust and productivity through emotionally intelligent leadership.',
    thumbnailUrl: thumb('empathylead'),
    instructor: { id: 'i5', name: 'David Park', title: 'VP People Ops', avatar: avatar('David'), bio: '' },
    lessons: [],
    totalDuration: 12600,
    enrolledCount: 2300,
    category: 'Leadership',
    progress: 34,
    status: 'in_progress',
  },
  {
    id: 'c6',
    title: 'AI Implementation in Microservices',
    description: 'Integrate machine learning models into distributed microservice architectures.',
    thumbnailUrl: thumb('aiservices'),
    instructor: { id: 'i6', name: 'Priya Patel', title: 'ML Engineer', avatar: avatar('Priya'), bio: '' },
    lessons: [],
    totalDuration: 21600,
    enrolledCount: 640,
    category: 'Engineering',
    progress: 0,
    status: 'not_started',
  },
  {
    id: 'c7',
    title: 'Full Stack Performance Tuning',
    description: 'From database queries to front-end rendering — optimize every layer.',
    thumbnailUrl: thumb('perftuning'),
    instructor: { id: 'i7', name: 'Alex Kim', title: 'Staff Engineer', avatar: avatar('Alex'), bio: '' },
    lessons: [],
    totalDuration: 16200,
    enrolledCount: 890,
    category: 'Engineering',
    progress: 0,
    status: 'not_started',
  },
  {
    id: 'c8',
    title: 'Cybersecurity Essentials: Zero Trust Framework',
    description: 'Implement a Zero Trust security model across your organization.',
    thumbnailUrl: thumb('cybersec'),
    instructor: { id: 'i8', name: 'Nina Brooks', title: 'CISO', avatar: avatar('Nina'), bio: '' },
    lessons: [],
    totalDuration: 19800,
    enrolledCount: 1750,
    category: 'Security',
    progress: 45,
    status: 'in_progress',
  },
];

export const continueLearningCourses = courses.filter(c => c.status === 'in_progress');

// ============================
// Watch History
// ============================
export const watchHistory: HistoryItem[] = [
  { id: 'h1', video: discoveryVideos[0], watchedAt: '2024-10-28T18:00:00Z', progress: 72, watchedDuration: 1858 },
  { id: 'h2', video: discoveryVideos[1], watchedAt: '2024-10-28T15:00:00Z', progress: 100, watchedDuration: 1920 },
  { id: 'h3', video: recentUploads[0], watchedAt: '2024-10-27T20:00:00Z', progress: 45, watchedDuration: 648 },
  { id: 'h4', video: recentUploads[2], watchedAt: '2024-10-27T10:00:00Z', progress: 30, watchedDuration: 540 },
  { id: 'h5', video: discoveryVideos[3], watchedAt: '2024-10-26T14:00:00Z', progress: 100, watchedDuration: 3180 },
  { id: 'h6', video: recentUploads[3], watchedAt: '2024-10-25T11:00:00Z', progress: 88, watchedDuration: 2112 },
];

// ============================
// Playlists
// ============================
export const playlists: Playlist[] = [
  { id: 'pl1', title: 'Strategy 2024 Kickoff', thumbnailUrl: thumb('strategy24'), videoCount: 8, isPrivate: false },
  { id: 'pl2', title: 'Compliance Essentials', thumbnailUrl: thumb('compliance'), videoCount: 12, isPrivate: false },
  { id: 'pl3', title: 'My Learning Path', thumbnailUrl: thumb('mylearning'), videoCount: 5, isPrivate: true },
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
// Up Next Videos (for watch page sidebar)
// ============================
export const upNextVideos: Video[] = [
  {
    id: 'v-up1',
    title: 'Quarterly Marketing Alignment & Brand Audit',
    description: 'Review of brand consistency and marketing performance metrics.',
    thumbnailUrl: thumb('marketing'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 1860,
    views: 1200,
    likes: 89,
    createdAt: '2024-10-27T10:00:00Z',
    channel: { id: 'ch7', name: 'Marketing Dept', avatar: avatar('Marketing') },
    category: 'Townhall',
    tags: ['marketing', 'brand'],
  },
  {
    id: 'v-up2',
    title: 'Engineering Sprint Review: Project Phoenix',
    description: 'Technical review of the latest sprint deliverables and roadmap updates.',
    thumbnailUrl: thumb('phoenix'),
    videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    duration: 2400,
    views: 860,
    likes: 67,
    createdAt: '2024-10-24T14:00:00Z',
    channel: { id: 'ch8', name: 'Product Dev', avatar: avatar('ProductDev') },
    category: 'Townhall',
    tags: ['engineering', 'sprint'],
  },
];

// ============================
// Activity Feed (Profile page)
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
  { id: 'act2', type: 'watched', title: 'Watched Q4 Townhall', subtitle: 'Left a comment on slide 14', timeAgo: 'Yesterday' },
  { id: 'act3', type: 'created', title: 'Created New Playlist', subtitle: 'Added "Leadership 101" series', timeAgo: '3 days ago' },
  { id: 'act4', type: 'replied', title: 'Reply in Engineering Forum', subtitle: 'Regarding "API Documentation" video', timeAgo: '5 days ago' },
];
