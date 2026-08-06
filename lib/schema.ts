export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    subscriptionStatus: String!
    featureFlags: [String!]!
    createdAt: String
    updatedAt: String
  }

  type PinterestAccount {
    id: ID!
    userId: ID!
    username: String!
    email: String
    authMethod: String
    profileImage: String!
    followers: Int!
    following: Int!
    boardsCount: Int!
    monthlyViews: Int!
    status: String!
    syncStatus: String!
    lastSyncTime: String
    lastPostTime: String
    defaultDestinationUrl: String
    createdAt: String
    updatedAt: String
  }

  type Board {
    id: ID!
    accountId: ID!
    pinterestId: String!
    name: String!
    description: String!
    pinsCount: Int!
    followers: Int!
    archived: Boolean!
    createdAt: String
    updatedAt: String
  }

  type Pin {
    id: ID!
    userId: ID!
    accountIds: [ID!]!
    title: String!
    description: String!
    destinationUrl: String!
    mediaUrl: String!
    mediaType: String!
    boardId: String!
    scheduledAt: String!
    status: String!
    error: String
    createdAt: String
    updatedAt: String
  }

  type ContentLibraryItem {
    id: ID!
    userId: ID!
    title: String!
    description: String!
    mediaUrl: String!
    link: String!
    tags: [String!]!
    createdAt: String
    updatedAt: String
  }

  type AutomationRule {
    id: ID!
    userId: ID!
    name: String!
    accountIds: [ID!]!
    boardId: String!
    time: String!
    days: [String!]!
    evergreen: Boolean!
    status: String!
    createdAt: String
    updatedAt: String
  }

  type ActivityLog {
    id: ID!
    userId: ID!
    action: String!
    details: String!
    accountUsername: String
    timestamp: String!
    status: String!
  }

  type TeamMember {
    id: ID!
    name: String!
    email: String!
    role: String!
    status: String!
  }

  type PerformanceDay {
    date: String!
    impressions: Int!
    saves: Int!
    clicks: Int!
  }

  type AnalyticsBoard {
    name: String!
    impressions: Int!
    saves: Int!
    clicks: Int!
  }

  type GrowthSummary {
    totalImpressions: Int!
    totalSaves: Int!
    totalClicks: Int!
    impressionsGrowthPercent: Float!
    savesGrowthPercent: Float!
    clicksGrowthPercent: Float!
    followersGrowth: Int!
  }

  type AnalyticsResult {
    performanceData: [PerformanceDay!]!
    topBoards: [AnalyticsBoard!]!
    growthSummary: GrowthSummary!
  }

  type SEOKeywordDetail {
    keyword: String!
    monthlySearchVolume: String!
    competitionLevel: String!
    intent: String!
  }

  type AICaptionResult {
    title: String!
    description: String!
    keywords: [String!]!
    keywordDetails: [SEOKeywordDetail!]
    hashtags: [String!]!
    cta: String!
    seoScore: Int
    searchVolumeEstimate: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type AdminDashboardResult {
    totalUsersCount: Int!
    activeSchedulesCount: Int!
    connectedPinterestAccountsCount: Int!
    totalPinsPublishedCount: Int!
    apiUsageLimit: Int!
    apiUsageCurrent: Int!
  }

  input PinInput {
    id: ID
    accountIds: [ID!]!
    title: String!
    description: String
    destinationUrl: String
    mediaUrl: String!
    mediaType: String
    boardId: String!
    scheduledAt: String!
    status: String
  }

  input ContentItemInput {
    id: ID
    title: String!
    description: String
    mediaUrl: String!
    link: String
    tags: [String!]
  }

  input AutomationRuleInput {
    id: ID
    name: String!
    accountIds: [ID!]!
    boardId: String!
    time: String!
    days: [String!]!
    evergreen: Boolean!
    status: String
  }

  type Query {
    me: User
    pinterestAccounts: [PinterestAccount!]!
    boards(accountId: ID!): [Board!]!
    pins(status: String, accountId: ID): [Pin!]!
    contentLibrary(search: String): [ContentLibraryItem!]!
    analytics(accountId: ID, range: String!): AnalyticsResult!
    automationRules: [AutomationRule!]!
    activityLogs(limit: Int): [ActivityLog!]!
    teamMembers: [TeamMember!]!
    adminDashboard: AdminDashboardResult!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    
    connectPinterestAccount(code: String, usernameOverride: String, email: String, password: String): PinterestAccount!
    disconnectPinterestAccount(accountId: ID!): Boolean!
    updateAccountDefaultLink(accountId: ID!, defaultDestinationUrl: String!): PinterestAccount!
    
    savePin(input: PinInput!): Pin!
    publishPinNow(input: PinInput!): Pin!
    duplicatePin(id: ID!): Pin!
    bulkUploadPins(csvContent: String!, accountIds: [ID!]!): [Pin!]!
    deletePin(id: ID!): Boolean!
    
    createBoard(accountId: ID!, name: String!, description: String): Board!
    
    generateAICaption(prompt: String!, keywords: [String!]): AICaptionResult!
    
    saveContentItem(input: ContentItemInput!): ContentLibraryItem!
    deleteContentItem(id: ID!): Boolean!
    
    saveAutomationRule(input: AutomationRuleInput!): AutomationRule!
    deleteAutomationRule(id: ID!): Boolean!
    
    triggerAutomationCheck: Boolean!
    
    inviteTeamMember(email: String!, role: String!): TeamMember!
    removeTeamMember(id: ID!): Boolean!
  }
`;
